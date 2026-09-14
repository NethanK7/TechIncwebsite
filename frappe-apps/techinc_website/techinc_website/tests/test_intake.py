"""Run with bench --site TEST_SITE run-tests --app techinc_website.

Requires ERPNext or Frappe CRM. Uses transactions; do not run on production.
"""
from unittest.mock import patch
from uuid import uuid4

import frappe
from frappe.tests.utils import FrappeTestCase

from techinc_website.api.public import SUBMISSION, health, submit_assessment, submit_enquiry
from techinc_website.validation import QUESTIONS


class TestIntake(FrappeTestCase):
    def setUp(self):
        frappe.set_user('Administrator')
        self.settings = frappe.get_single('Website Settings TI')
        self.settings.enabled = 0
        self.settings.lead_doctype = 'Lead' if frappe.db.exists('DocType', 'Lead') else 'CRM Lead'
        if not frappe.db.exists('DocType', self.settings.lead_doctype):
            self.skipTest('Install ERPNext or Frappe CRM to run integration tests.')
        self.secret = 'test-only-' + 'a' * 40
        self.settings.intake_secret = self.secret
        self.settings.follow_up_days = 1
        self.settings.analytics_retention_days = 90
        self.settings.contact_source = ''
        self.settings.assessment_source = ''
        self.settings.default_assignee = ''
        if self.settings.lead_doctype == 'CRM Lead':
            self.settings.lead_status = frappe.db.get_value('CRM Lead Status', {}, 'name')
        else:
            self.settings.lead_status = 'Lead'
        self.settings.enabled = 1
        self.settings.save()
        self.data = dict(name='Website Integration Test', email=f'ti-{uuid4().hex}@example.com',
                         organization='Test organisation', message='A test enquiry from the website.',
                         submission_id=str(uuid4()), website_secret=self.secret)

    def tearDown(self):
        frappe.set_user('Administrator')
        frappe.db.rollback()

    def test_contact_retry_and_assessment_reuse_lead(self):
        first = submit_enquiry(**self.data)
        retry = submit_enquiry(**self.data)
        self.assertEqual(first, retry)
        self.assertTrue(first['lead'])
        self.assertEqual(frappe.db.count(SUBMISSION, {'submission_id': self.data['submission_id']}), 1)
        assessed = submit_assessment(**{**self.data, 'submission_id': str(uuid4()), 'assessment_version': '1',
            'answers': [{'question_id': q['id'], 'option_id': '0', 'score': 0} for q in QUESTIONS]})
        self.assertEqual(assessed['lead'], first['lead'])
        self.assertEqual(assessed['score'], 82)
        doc = frappe.get_doc(SUBMISSION, assessed['assessment'])
        self.assertEqual(len(doc.answers), 10)
        self.assertEqual(doc.organization, self.data['organization'])
        self.assertEqual(frappe.db.count('Comment', {'reference_doctype': self.settings.lead_doctype,
                                                  'reference_name': first['lead'], 'comment_type': 'Comment'}), 2)

    def test_changed_payload_cannot_reuse_id(self):
        submit_enquiry(**self.data)
        with self.assertRaises(frappe.ValidationError):
            submit_enquiry(**{**self.data, 'message': 'Different details for same submission ID.'})

    def test_existing_lead_not_overwritten(self):
        first = submit_enquiry(**self.data)
        frappe.db.set_value(self.settings.lead_doctype, first['lead'], 'first_name', 'Salesperson edit')
        again = submit_enquiry(**{**self.data, 'submission_id': str(uuid4()), 'email': self.data['email'].upper()})
        self.assertEqual(first['lead'], again['lead'])
        self.assertEqual(frappe.db.get_value(self.settings.lead_doctype, first['lead'], 'first_name'), 'Salesperson edit')

    def test_guest_and_wrong_secret_are_denied(self):
        with self.assertRaises(frappe.PermissionError):
            submit_enquiry(**{**self.data, 'website_secret': 'wrong'})
        frappe.set_user('Guest')
        with self.assertRaises(frappe.PermissionError):
            submit_enquiry(**self.data)

    def test_disabled_and_incomplete_assessments(self):
        with self.assertRaises(frappe.ValidationError):
            submit_assessment(**self.data, assessment_version='1', answers=[])
        self.settings.enabled = 0
        self.settings.save()
        with self.assertRaises(frappe.ValidationError):
            submit_enquiry(**self.data)

    def test_assignment_and_health(self):
        self.settings.default_assignee = 'Administrator'
        self.settings.save()
        self.assertTrue(health(self.secret)['assignment_enabled'])
        first = submit_enquiry(**self.data)
        submit_enquiry(**self.data)
        self.assertEqual(frappe.db.count('ToDo', {'reference_type': SUBMISSION,
                                               'reference_name': first['enquiry']}), 1)
        self.assertEqual(frappe.db.count('Notification Log', {'document_type': SUBMISSION,
                                                            'document_name': first['enquiry']}), 1)

    def test_request_rollback_leaves_no_partial_submission(self):
        # Frappe's HTTP layer rolls back a failed POST; emulate that boundary.
        frappe.db.savepoint('failed_request')
        with patch('techinc_website.api.public._lead', side_effect=RuntimeError('Simulated CRM failure')):
            with self.assertRaises(RuntimeError):
                submit_enquiry(**self.data)
        frappe.db.rollback(save_point='failed_request')
        self.assertEqual(frappe.db.count(SUBMISSION, {'submission_id': self.data['submission_id']}), 0)
        self.assertTrue(submit_enquiry(**self.data)['lead'])

    def test_integration_user_can_submit_but_cannot_read_leads(self):
        email = f'ti-api-{uuid4().hex}@example.com'
        user = frappe.get_doc({'doctype': 'User', 'email': email, 'first_name': 'Website API',
                               'send_welcome_email': 0, 'roles': [{'role': 'Website Integration TI'}]})
        user.insert()
        frappe.set_user(email)
        self.assertFalse(frappe.has_permission(self.settings.lead_doctype, 'read'))
        result = submit_enquiry(**self.data)
        self.assertTrue(result['stored'])
        self.assertFalse(frappe.has_permission(SUBMISSION, 'read'))
