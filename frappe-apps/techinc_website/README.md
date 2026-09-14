# Techinc Website

Installable Frappe app for the TECHINCGLOBAL website. It saves contact enquiries
and ERP readiness assessments, creates or reuses a lead by email, and gives your
team a **Techinc Website** workspace with submission history and follow-up tasks.

Targets Frappe 15 and 16 (including v16 API changes). Install **ERPNext** (`Lead`) or **Frappe CRM** (`CRM Lead`)
on the same site. Choose the lead system in settings; this app does not install
or replace your CRM. See `TESTING.md` for the versions actually verified.

Frappe v16 itself requires Python 3.12 or newer; use the Python version required
by your bench when installing this app. The app remains compatible with the
Python versions supported by Frappe v15.

## Install on a self-hosted bench (Frappe 15 or 16)

Back up the target site, then copy this entire app folder to
`YOUR_BENCH/apps/techinc_website`. From the bench directory:

```sh
bench --site YOUR_SITE backup
./env/bin/pip install -e apps/techinc_website
./env/bin/python - <<'PY'
from pathlib import Path
p = Path('sites/apps.txt')
apps = p.read_text().splitlines()
if 'techinc_website' not in apps:
    p.write_text('\n'.join(apps + ['techinc_website']) + '\n')
PY
bench --site YOUR_SITE install-app techinc_website
bench --site YOUR_SITE migrate
bench build --app techinc_website
bench restart
```

On a development bench, restart `bench start` instead of `bench restart`.
The commands are the same on v16. Once the app is in its own Git repository, the normal alternative is
`bench get-app YOUR_REPOSITORY_URL` followed by the install/migrate commands.
The app root is this folder, not the parent Astro website repository.

### Frappe Cloud

Push this folder as the root of a Git repository. Add it as a custom app to a
bench group that supports custom apps, deploy the bench, then install it on your
site. The downloaded ZIP itself is not a Frappe Cloud marketplace installer.

## Configure in Frappe

1. Open **Website Settings TI** from the Desk search bar as System Manager.
2. Select **Lead** for ERPNext or **CRM Lead** for Frappe CRM. If both are
   installed, deliberately choose which system will own website leads.
3. For Frappe CRM, set **New lead status** to an existing CRM Lead Status, such
   as `New`. ERPNext defaults to `Lead`.
4. Generate a random secret of at least 32 characters (for example with a
   password manager). Paste it into **Intake secret**.
5. Optionally choose existing **Contact lead source** and **Assessment lead
   source** records. Create `Website Contact` and `Website Assessment` in the
   selected CRM's source list first if you want those exact labels.
6. Optionally set **Sales follow-up owner** and the number of calendar days.
   Give this person **Website Manager TI** plus normal CRM permissions. Each
   new submission creates a ToDo and an in-app notification. Assessment scores
   of 80+ get high-priority tasks. No outgoing email is required.
7. Enable intake and save. Invalid CRM/status/source/secret settings block saving.
8. Create a dedicated enabled **System User** for the website, disable its
   welcome email if appropriate, and give it **Website Integration TI** only.
   Generate its API key and secret under User → API Access. Do not use the
   Administrator account or give this user broad CRM roles.
9. Give your sales team **Website Manager TI** to access the workspace at
   `/app/techinc-website`. Settings remain restricted to System Manager.

The integration role can call the authenticated intake API but has no generic
read/write permission on submissions or leads. Native CRM access is governed
by the CRM roles you assign to your sales team.

## Connect the website

Deploy the updated Astro website supplied alongside this app. Configure these
server-only variables on Vercel (Production, and a separate test site for Preview):

```dotenv
FRAPPE_URL=https://YOUR-FRAPPE-SITE
FRAPPE_API_KEY=YOUR-INTEGRATION-USER-KEY
FRAPPE_API_SECRET=YOUR-INTEGRATION-USER-SECRET
WEBSITE_INTAKE_SECRET=SAME-SECRET-AS-WEBSITE-SETTINGS-TI
```

Redeploy after setting them. The browser calls `/api/contact` and
`/api/assessment` on the website; only the website server calls Frappe. Do not
prefix these variables with `PUBLIC_`. No browser-to-Frappe CORS setting is
needed. Serve the website with its Vercel server functions, not as a static ZIP.

All Support links now open `https://support.techincglobal.com/`. Old `/support`
links redirect there. The retired `/api/ticket` returns HTTP 410 with the portal
URL; this app deliberately does not create Helpdesk tickets.

## Check the connection

With the four variables loaded into your shell, run the included read-only
check. It does not create test leads or print credentials:

```sh
python3 scripts/check_connection.py
```

Then submit one contact form and one completed assessment on a staging website.
In **Website Submission TI**, verify all details, ten assessment answers, score,
and the native Lead link. Using the same email should produce two submissions
linked to one lead. Retrying the same submission must not create another task
or lead. Test a backend outage: the form must retain details and offer retry,
not claim the details were saved.

## How records work

- **Website Submission TI:** one contact, consultation or assessment submission;
  captures name, email, phone, organisation, industry, company size, service,
  message, source page, referrer, session, score and answers as applicable.
  Sales users can update follow-up status and notes.
- **Website Answer TI:** child records for each assessment answer, including
  the authoritative option score and question/option IDs.
- **Website Lead Identity TI:** internal email-to-lead mapping. A database row
  lock serializes website submissions for the same email and lead system.
- **Website Settings TI:** integration and follow-up configuration.
- **Website Event TI:** optional first-party analytics, disabled by default;
  daily cleanup uses the configured retention period. Scheduler must run for
  cleanup. Leads and submissions are never automatically purged.

A lead and its submission are saved in one database transaction. Each browser
submission has a UUID. A retry with the same UUID and business data returns the
original reference; reusing it with different data is rejected. Changing form
details generates a new UUID. If Frappe times out after committing, retrying
recovers the same saved record. Reloading the page starts a new submission.

Existing leads are linked by normalized email and are not overwritten. Each
submission adds a timeline link. If existing duplicates are already in CRM,
one matching lead is selected; the app does not merge historical duplicates.
Concurrency protection covers this app's writers; other integrations should
also enforce their own deduplication. Changing lead systems starts a separate
identity mapping and does not migrate previous leads.

Industry and company-size labels are preserved on the submission rather than
forced into incompatible CRM Link/Select options. Site-specific mandatory lead
fields may require a small mapping extension in `api/public.py`; standard
ERPNext/Frappe CRM fields are handled. No report email is generated automatically:
the sales team reviews the captured assessment and follows up.

## API contract

All methods require authenticated POST requests plus the intake secret. They
are under `/api/method/techinc_website.api.public.METHOD` and return a normal
Frappe `message` envelope. Authorization is `token API_KEY:API_SECRET`; pass
`X-Website-Secret` or `website_secret` in JSON. Guest access is disabled.

- `health`: validates configuration; returns version, lead type and readiness.
- `submit_enquiry`: `submission_id` (UUID), `name`, `email`, `message` (10–4000
  characters), optional `kind` (`contact`/`consultation`), `phone`, `organization`,
  `employees`, `industry`, `interest`, `page`, `referrer`, `session`. Returns
  `{stored: true, enquiry: "WEB-...", lead: "..."}`.
- `submit_assessment`: UUID, name, email, `assessment_version: "1"`, and exactly
  ten `answers: [{question_id: "system", option_id: "0"}, ...]`; optional phone,
  organisation, page and session. Returns stored flag, assessment reference,
  lead, authoritative score and band. Browser scores are ignored.
- `record_event`: optional analytics endpoint; accepts event type, session,
  path, optional referrer/value/meta/country/device. Disabled by default.

Name max 120; email/organisation/page max 140; phone max 40; session max 80.
Question definitions live in `assessment_v1.json`; the website ships the same
file. Keep both copies identical. Version any future scoring/question changes
so old browser payloads cannot silently be scored with new definitions.

## Operations and troubleshooting

- 401/403: verify the API user is enabled, its role, token and shared secret.
- Validation error: check enabled setting, installed CRM, lead status/source,
  required form data and any site-specific mandatory CRM fields.
- Timeout/502 from website: verify public HTTPS reachability and Frappe logs.
  Retry the form; the same submission ID is safe. Website logs omit form PII.
- Missing tasks: set a follow-up owner; existing submissions are not backfilled.
- Missing analytics: enable explicitly; analytics failures do not block forms.
- The website's in-memory rate limit is per server instance. Use a shared/edge
  rate limit for stronger production abuse protection; the secret is not one.
- Upgrade: back up, update app code, `bench --site YOUR_SITE migrate`, build and
  restart. Deploy matching website changes. Do not uninstall to upgrade:
  uninstalling a Frappe app can delete its DocTypes and captured submissions.

Official references: [Frappe REST API](https://docs.frappe.io/framework/user/en/api/rest),
[app structure](https://docs.frappe.io/framework/user/en/basics/apps),
[hooks](https://docs.frappe.io/framework/user/en/python-api/hooks).
