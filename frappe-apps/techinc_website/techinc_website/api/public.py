"""Authenticated website intake. All writes commit together at Frappe's POST boundary.

The Integration role has no generic DocType write permissions. These methods
validate a fixed schema before performing narrowly scoped privileged writes.
"""
import hashlib
import hmac
import json
from html import escape

import frappe
from frappe.utils import add_days, today

from techinc_website import __version__
from techinc_website.validation import VERSION, assessment, contact, fingerprint, text

SETTINGS = 'Website Settings TI'
SUBMISSION = 'Website Submission TI'
IDENTITY = 'Website Lead Identity TI'


def _authorize(website_secret=None):
    if frappe.session.user == 'Guest' or not set(frappe.get_roles()) & {'Website Integration TI', 'System Manager'}:
        frappe.throw('Website integration access required.', frappe.PermissionError)
    settings = frappe.get_single(SETTINGS)
    expected = settings.get_password('intake_secret', raise_exception=False) or ''
    supplied = website_secret or (frappe.request.headers.get('X-Website-Secret', '') if frappe.request else '')
    if not isinstance(supplied, str) or not expected or not hmac.compare_digest(expected, supplied):
        frappe.throw('Invalid intake credentials.', frappe.PermissionError)
    if not settings.enabled:
        frappe.throw('Website intake is disabled.')
    return settings


def check_configuration(settings):
    dt = settings.lead_doctype
    if dt not in ('Lead', 'CRM Lead') or not frappe.db.exists('DocType', dt):
        frappe.throw('Install the selected ERPNext or Frappe CRM lead system first.')
    meta = frappe.get_meta(dt)
    for field in ('first_name', 'email_id' if dt == 'Lead' else 'email'):
        if not meta.has_field(field):
            frappe.throw(f'{dt} is missing required field {field}.')
    status = settings.lead_status or ('Lead' if dt == 'Lead' else '')
    status_field = meta.get_field('status')
    if not status:
        frappe.throw('Set the new lead status in Website Settings TI.')
    if status_field and status_field.fieldtype == 'Link':
        if not frappe.db.exists(status_field.options, status):
            frappe.throw('The configured new lead status does not exist.')
    elif status_field and status_field.fieldtype == 'Select' and status not in (status_field.options or '').split('\n'):
        frappe.throw('The configured new lead status is invalid.')
    source_field = meta.get_field('source')
    for source in (settings.contact_source, settings.assessment_source):
        if source and (not source_field or source_field.fieldtype != 'Link' or not frappe.db.exists(source_field.options, source)):
            frappe.throw('The configured lead source does not exist.')
    if settings.default_assignee:
        user = frappe.db.get_value('User', settings.default_assignee, ['enabled', 'user_type'], as_dict=True)
        if not user or not user.enabled or user.user_type != 'System User':
            frappe.throw('The follow-up owner must be an enabled System User.')
        if not set(frappe.get_roles(settings.default_assignee)) & {'Website Manager TI', 'System Manager'}:
            frappe.throw('The follow-up owner needs the Website Manager TI role.')
    return dt, status


@frappe.whitelist(methods=['POST'])
def health(website_secret=None):
    settings = _authorize(website_secret)
    dt, status = check_configuration(settings)
    return {'ok': True, 'version': __version__, 'assessment_version': VERSION,
            'lead_doctype': dt, 'lead_status': status, 'assignment_enabled': bool(settings.default_assignee)}


def _validated(data, kind):
    try:
        clean = contact(data)
        clean['kind'] = kind
        if kind == 'assessment':
            clean['answers'], clean['score'], clean['band'] = assessment(data.get('answers'), data.get('assessment_version'))
            clean['assessment_version'] = VERSION
        elif len(clean['message']) < 10:
            raise ValueError('Please give us a message of at least 10 characters.')
        return clean
    except ValueError as exc:
        frappe.throw(str(exc))


def _identity(data, dt):
    """A unique row per email/system serializes website lead creation until commit."""
    key = hashlib.sha256(f'{dt}:{data["email"]}'.encode()).hexdigest()
    frappe.db.savepoint('website_identity')
    try:
        frappe.get_doc({'doctype': IDENTITY, 'name': key, 'email': data['email'], 'lead_doctype': dt}).insert(ignore_permissions=True)
    except frappe.DuplicateEntryError:
        frappe.db.rollback(save_point='website_identity')
    # A locking read sees the latest committed row even under repeatable-read.
    identity = frappe.db.get_value(IDENTITY, key, ['name', 'lead'], as_dict=True, for_update=True)
    if not identity:
        frappe.throw('Could not reserve lead identity. Please retry.')
    return identity


def _lead(data, settings, dt, status):
    identity = _identity(data, dt)
    email_field = 'email_id' if dt == 'Lead' else 'email'
    existing = identity.lead
    if existing and not frappe.db.exists(dt, existing):
        existing = None
    if not existing:
        existing = frappe.db.get_value(dt, {email_field: data['email']}, 'name', for_update=True)
    if not existing:
        first, _, last = data['name'].partition(' ')
        values = {'doctype': dt, 'first_name': first, 'last_name': last, email_field: data['email'],
                  'mobile_no': data['phone'], 'status': status,
                  'company_name' if dt == 'Lead' else 'organization': data['organization']}
        source = settings.assessment_source if data['kind'] == 'assessment' else settings.contact_source
        if source:
            values['source'] = source
        if settings.default_assignee:
            values['lead_owner'] = settings.default_assignee
        # Company size / industry remain exactly as entered on the submission;
        # don't force website labels into incompatible CRM Link/Select fields.
        meta = frappe.get_meta(dt)
        values = {k: v for k, v in values.items() if k == 'doctype' or meta.has_field(k)}
        existing = frappe.get_doc(values).insert(ignore_permissions=True).name
    # Never overwrite a salesperson's existing lead data, owner or status.
    frappe.db.set_value(IDENTITY, identity.name, 'lead', existing)
    return existing


def _save(data, settings):
    dt, status = check_configuration(settings)
    key = 'WEB-' + hashlib.sha256(data['submission_id'].encode()).hexdigest()[:32]
    digest = fingerprint(data)
    frappe.db.savepoint('website_submission')
    try:
        doc = frappe.get_doc({'doctype': SUBMISSION, 'name': key, 'kind': data['kind'],
                             'submission_id': data['submission_id'], 'payload_hash': digest})
        doc.insert(ignore_permissions=True)
    except frappe.DuplicateEntryError:
        frappe.db.rollback(save_point='website_submission')
        existing = frappe.db.get_value(SUBMISSION, key, ['name', 'payload_hash', 'lead', 'score', 'band'],
                                       as_dict=True, for_update=True)
        if not existing or existing.payload_hash != digest:
            frappe.throw('This submission ID was already used for different details. Start a new submission.')
        return _response(existing, data['kind'])
    lead = _lead(data, settings, dt, status)
    for field in ('kind', 'email', 'phone', 'organization', 'industry', 'employees', 'interest', 'message',
                  'subject', 'description', 'priority', 'category', 'helpdesk_ticket',
                  'page', 'referrer', 'score', 'band', 'assessment_version'):
        doc.set(field, data.get(field))
    doc.full_name = data['name']
    doc.visitor_session = data['session']
    doc.lead_doctype = dt
    doc.lead = lead
    for answer in data.get('answers', []):
        doc.append('answers', answer)
    doc.save(ignore_permissions=True)
    # A timeline link is visible in the lead's native UI. User text is escaped.
    label = 'Website assessment' if data['kind'] == 'assessment' else 'Website enquiry'
    summary = f'{label}: {escape(data["name"])}'
    if data['kind'] == 'assessment':
        summary += f' — {data["score"]}/100 ({escape(data["band"])})'
    content = f'<p>{summary}</p><p><a href="/app/website-submission-ti/{key}">View full submission</a></p>'
    frappe.get_doc({'doctype': 'Comment', 'comment_type': 'Comment', 'reference_doctype': dt,
                    'reference_name': lead, 'content': content}).insert(ignore_permissions=True)
    if settings.default_assignee:
        frappe.get_doc({'doctype': 'ToDo', 'allocated_to': settings.default_assignee,
                        'assigned_by': frappe.session.user, 'reference_type': SUBMISSION, 'reference_name': key,
                        'description': summary, 'date': add_days(today(), settings.follow_up_days or 1),
                        'priority': 'High' if data.get('score', 0) >= 80 else 'Medium'}).insert(ignore_permissions=True)
        # In-app notification is transactional; no live email is sent by intake.
        frappe.get_doc({'doctype': 'Notification Log', 'type': 'Assignment',
                        'for_user': settings.default_assignee, 'from_user': frappe.session.user,
                        'document_type': SUBMISSION, 'document_name': key,
                        'subject': summary}).insert(ignore_permissions=True)
    return _response(doc, data['kind'])


def _helpdesk_ticket(data, lead):
    """Create an HD Ticket when Helpdesk is installed, preserving the CRM link."""
    if not frappe.db.exists('DocType', 'HD Ticket'):
        frappe.throw('Helpdesk is not installed on this Frappe site.')
    meta = frappe.get_meta('HD Ticket')
    values = {'doctype': 'HD Ticket'}
    candidates = {
        'subject': data['subject'], 'description': data['description'],
        'raised_by': data['email'], 'contact': data['email'],
        'priority': data['priority'], 'status': 'Open',
        'customer': data.get('organization'), 'lead': lead,
        'category': data.get('category'),
    }
    values.update({key: value for key, value in candidates.items()
                   if value and meta.has_field(key)})
    ticket = frappe.get_doc(values).insert(ignore_permissions=True)
    return ticket.name


def _response(doc, kind):
    result = {'stored': True, 'lead': doc.lead, 'assessment' if kind == 'assessment' else 'enquiry': doc.name}
    if kind == 'assessment':
        result.update(score=doc.score, band=doc.band)
    return result


@frappe.whitelist(methods=['POST'])
def submit_enquiry(website_secret=None, **data):
    settings = _authorize(website_secret)
    kind = data.get('kind', 'contact')
    if kind not in ('contact', 'consultation'):
        frappe.throw('Invalid enquiry type.')
    return _save(_validated(data, kind), settings)


@frappe.whitelist(methods=['POST'])
def submit_assessment(website_secret=None, **data):
    settings = _authorize(website_secret)
    return _save(_validated(data, 'assessment'), settings)


@frappe.whitelist(methods=['POST'])
def submit_ticket(website_secret=None, **data):
    settings = _authorize(website_secret)
    clean = _validated(data, 'ticket')
    clean['subject'] = text(data.get('subject'), 'subject', 200, True)
    clean['description'] = text(data.get('description'), 'description', 8000, True)
    clean['priority'] = text(data.get('priority') or 'Medium', 'priority', 10, True)
    if clean['priority'] not in ('Low', 'Medium', 'High', 'Urgent'):
        frappe.throw('Invalid ticket priority.')
    clean['category'] = text(data.get('category'), 'category', 80)
    dt, status = check_configuration(settings)
    lead = _lead(clean, settings, dt, status)
    ticket = _helpdesk_ticket(clean, lead)
    clean['helpdesk_ticket'] = ticket
    result = _save(clean, settings)
    result['ticket'] = ticket
    return result


@frappe.whitelist(methods=['POST'])
def record_event(website_secret=None, **data):
    settings = _authorize(website_secret)
    if not settings.analytics_enabled:
        return {'ok': True, 'stored': False}
    try:
        event = text(data.get('type'), 'event', 30, True)
        if event not in ('pageview', 'scroll_stage', 'cta_click', 'form_step', 'form_submit'):
            raise ValueError('Invalid event type.')
        meta = data.get('meta', {})
        if not isinstance(meta, dict) or len(meta) > 20:
            raise ValueError('Invalid event metadata.')
        encoded = json.dumps(meta, allow_nan=False)
        if len(encoded) > 4000:
            raise ValueError('Event metadata is too large.')
        fields = {key: text(data.get(key), key, limit) for key, limit in
                  {'session': 80, 'path': 140, 'referrer': 500, 'value': 200, 'country': 10, 'device': 30}.items()}
    except (ValueError, TypeError) as exc:
        frappe.throw(str(exc))
    frappe.get_doc({'doctype': 'Website Event TI', 'event_type': event,
                    'visitor_session': fields.pop('session'), 'meta_json': encoded, **fields}).insert(ignore_permissions=True)
    return {'ok': True, 'stored': True}
