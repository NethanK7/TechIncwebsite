---
title: "Understanding the Frappe framework: a technical overview"
description: "Doctypes, the ORM, hooks, background jobs and the permission model — what the framework actually gives you, from a delivery perspective."
published: 2026-04-08
topic: "Technical"
readingMinutes: 9
faq:
  - q: "What is the Frappe framework?"
    a: "Frappe is a full-stack, open-source web framework in Python and JavaScript. Its central abstraction is the doctype, which defines a data model, its form, its permissions and its server-side logic in one place. ERPNext is an application built on Frappe using the same tools available to any developer."
  - q: "Is Frappe customisation upgrade-safe?"
    a: "Frappe customisation is upgrade-safe when it is built as a proper Frappe app under version control, using hooks, custom doctypes and scripts. Customisation done as direct database changes is not upgrade-safe, and is the usual cause of a Frappe instance becoming stuck on an old version."
---
This is written for technical readers evaluating Frappe, or inheriting an instance. It covers what the framework actually provides and where the sharp edges are.

## The doctype is the whole idea

A doctype defines a data model, and in doing so it also defines the database table, the REST endpoints, the desk form, the list view, the permission surface and the hooks for server-side logic. One declaration, and the rest is generated.

The consequence is that "add a new business object" is a genuinely small task. A custom doctype for a document your business uses and nobody else's is an afternoon, not a project — and it arrives with an API and a UI for free.

The trade-off: the abstraction is opinionated. Working against the grain of doctypes is unpleasant, and code that tries to is usually a sign that the data model is wrong rather than that the framework is.

## The ORM is deliberately thin

`frappe.get_doc`, `frappe.get_all`, `frappe.db.set_value`. The API is small and maps closely to SQL, and dropping to `frappe.db.sql` is normal for reporting rather than an escape hatch.

The thing to internalise is the distinction between document operations and database operations. `doc.save()` runs validation, permissions and hooks. `frappe.db.set_value` does not. Both are correct in the right place, and mixing them up is the most common source of bugs we see in inherited code — usually as validation that silently never ran.

## Hooks are the extension contract

`hooks.py` is how an app extends the system without touching it: document events, scheduler entries, override classes, permission queries, fixtures. This is what makes customisation upgrade-safe.

The rule is simple and worth being dogmatic about. Customisation belongs in an app, under version control, expressed through hooks and custom doctypes. Customisation that lives as direct database edits or as unversioned server scripts in production is how a Frappe instance ends up frozen on an old version, which is precisely the trap the platform was supposed to avoid.

## Background jobs and the scheduler

Long work belongs in the queue — `frappe.enqueue` with short, default and long queues backed by Redis. The scheduler handles cron-style work through `scheduler_events`.

Two practical notes. Jobs need to be idempotent, because retries happen. And a scheduled job that fails silently is worse than one that never ran, so error handling that surfaces to a human is not optional.

## The permission model has layers

Role permissions, user permissions, document-level sharing, permission query conditions, and field-level read-only. Together these are more than adequate for real segregation of duties, which matters when auditors ask.

They are also easy to get subtly wrong, because the layers compose. A permission query condition that narrows a list view does not by itself secure the API for a single document. Test the permission model from the API surface, not from the desk UI.

## Where to be careful

**Migrations.** `bench migrate` runs patches and syncs doctypes. Schema changes to a large table are not free, and a maintenance window is a real requirement rather than a formality.

**Naming.** Autoname strategy is a decision you make once and live with. Changing a naming series after a year of documents is painful.

**Report performance.** Query reports over large tables need indexes you have thought about. The framework will happily let you write something that scans everything.

If you want this discussed against your specific stack, that is what our [Frappe customization and development](/services/frappe-customization-development) engagement is for.
