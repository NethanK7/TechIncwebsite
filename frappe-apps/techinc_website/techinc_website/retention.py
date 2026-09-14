import frappe
from frappe.utils import add_days, now_datetime


def clear_old_events():
    days = frappe.db.get_single_value('Website Settings TI', 'analytics_retention_days') or 90
    frappe.db.delete('Website Event TI', {'creation': ('<', add_days(now_datetime(), -int(days)))})
