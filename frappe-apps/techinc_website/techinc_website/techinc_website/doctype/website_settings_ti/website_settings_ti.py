import frappe
from frappe.model.document import Document


class WebsiteSettingsTI(Document):
    def validate(self):
        if self.follow_up_days is None or not 1 <= self.follow_up_days <= 365:
            frappe.throw('Follow-up days must be between 1 and 365.')
        if self.analytics_retention_days is None or not 1 <= self.analytics_retention_days <= 3650:
            frappe.throw('Analytics retention must be between 1 and 3650 days.')
        if self.enabled:
            secret = self.get_password('intake_secret', raise_exception=False) or ''
            if len(secret) < 32:
                frappe.throw('Set an intake secret of at least 32 characters.')
            from techinc_website.api.public import check_configuration
            check_configuration(self)
