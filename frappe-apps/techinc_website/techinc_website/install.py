import frappe


def ensure_roles():
    for role in ('Website Integration TI', 'Website Manager TI'):
        if not frappe.db.exists('Role', role):
            frappe.get_doc({'doctype': 'Role', 'role_name': role, 'desk_access': 1}).insert(ignore_permissions=True)


def after_install():
    ensure_roles()
    # Do not enable intake or create users/secrets without administrator setup.
    settings = frappe.get_single('Website Settings TI')
    if not frappe.db.exists('DocType', 'Lead') and frappe.db.exists('DocType', 'CRM Lead'):
        settings.lead_doctype = 'CRM Lead'
    settings.save(ignore_permissions=True)
