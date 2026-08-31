---
title: "Understanding the Frappe framework: what you're actually building on"
description: "Doctypes, the ORM, hooks and the permission model: the framework primitives that determine whether a customization survives the next upgrade."
published: 2026-08-26
topic: "Technical"
author: "lahiru-pathirana"
readingMinutes: 8
faq:
  - q: "What is the Frappe framework, technically?"
    a: "Frappe is a full-stack, open-source web framework written in Python and JavaScript. Its central abstraction is the doctype, which defines a data model, its form layout, its permissions and its server-side logic in one place. ERPNext is itself an application built on Frappe, using the same tools available to any developer building a custom app."
  - q: "Is customization on Frappe upgrade-safe?"
    a: "It is, when built the right way: as a proper Frappe app under version control, using hooks, custom doctypes and scripts rather than direct database edits. Customization done by editing the database or core files directly isn't upgrade-safe, and it's the most common reason a Frappe or ERPNext instance ends up stuck on an old version."
---
The question that actually matters when evaluating an ERP platform for the long term isn't "what does it do out of the box." It's "what happens when we need it to do something it doesn't do yet." On Frappe, the answer comes down to a handful of framework primitives, and it decides whether a customization is an asset or a liability five years from now.

## The doctype is the whole idea

Everything in Frappe, a Sales Invoice, a Customer, a custom "Site Visit Report" you define yourself, is a doctype. A doctype declares a data model, generates its database table, its list and form views, its permission rules and its server-side validation, all from one definition. That's the biggest difference from frameworks where the data model, the UI and the business logic live in three separate places someone has to keep in sync by hand. In Frappe they're one artifact.

That matters practically. When we build a custom doctype for a client's specific process, we're not bolting a feature onto ERPNext. We're using exactly the same mechanism ERPNext's own Sales Invoice or Purchase Order was built with.

## The ORM and hooks: how logic actually attaches

Frappe's ORM (`frappe.get_doc`, `.save()`, `.submit()`) is how server-side code reads and writes documents without hand-written SQL for the common cases. Business logic attaches through hooks, functions registered against specific events (`on_submit`, `validate`, `before_save`) on specific doctypes. This is what makes upgrade-safety possible: your custom logic lives in your own app, registered against the framework's event system, rather than edited into ERPNext's own source files. When ERPNext ships an update, your hooks still fire. You never had to touch a single line ERPNext maintains.

This is the practical difference between the two kinds of "customization" people talk about as if they're the same thing. A custom Frappe app with its own doctypes, hooks and scripts survives a framework upgrade untouched. Code edited directly into core files, or database columns added by hand outside a migration, doesn't. That's the most common reason we see a Frappe or ERPNext instance stuck on an old version, because nobody can upgrade without knowing what's going to break.

## The permission model

Role-based permissions get configured per doctype, per role, down to field-level read and write control and document-level ownership and sharing rules. This is what lets a single system serve a warehouse clerk, a finance controller and an auditor with genuinely different views of the same underlying data, without needing three separate applications.

## Background jobs and the rest of the platform

Scheduled jobs, background workers for long-running tasks, a built-in REST API generated from the same doctype definitions, and real-time updates over websockets are all part of the same framework. That's why an integration, a report, or a scheduled reconciliation job gets built with the same tools as everything else, not a separate bolt-on stack.

## Why this is the actual pitch

None of this is visible in a first demo. It shows up two years in, the first time a business needs something the standard configuration never anticipated, and it decides whether that need gets built as a proper, upgrade-safe extension of the platform, or as a workaround that becomes the reason the next upgrade keeps getting postponed.
