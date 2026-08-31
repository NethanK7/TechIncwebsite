---
title: "Frappe and n8n: where a workflow tool fits next to an ERP"
description: "n8n is good at gluing systems together. Frappe is good at owning the transaction. Confusing the two is how automation projects turn into a second source of truth."
published: 2026-08-29
topic: "Integration"
author: "shakthi-rodrigo"
readingMinutes: 6
faq:
  - q: "Can Frappe ERP be integrated with n8n for workflow automation?"
    a: "Yes. Frappe exposes a REST API generated from its doctypes and supports outgoing webhooks on document events, both of which n8n can consume directly: triggering an n8n workflow when a document is created or updated, or having n8n call back into Frappe's API to create or update records."
  - q: "Should business logic live in n8n or inside Frappe itself?"
    a: "Logic that determines what a transaction means to your business (pricing, approvals, ledger posting) should live inside Frappe, where it's versioned, tested and covered by the same permission model as everything else. n8n is the right place for connecting Frappe to external systems and orchestrating multi-step processes that span tools Frappe doesn't own."
---
n8n and similar workflow tools get pitched as a way to automate "everything," which is exactly the framing that gets automation projects into trouble next to an ERP. The useful question isn't whether to use n8n. It's where the line sits between what n8n should own and what has to stay inside Frappe.

## What n8n is actually good at

n8n excels at connecting systems that were never designed to talk to each other: a form submission triggering a Slack message and a CRM update, a scheduled job pulling data from a third-party API and pushing it somewhere else, a multi-step approval that spans email, a spreadsheet and a couple of SaaS tools. It's a workflow orchestrator, and for gluing together tools Frappe doesn't own, it's a genuinely good fit. Faster to stand up than a custom integration script for a one-off external connection.

Frappe supports this cleanly on both sides. Webhooks fire out to n8n when a document is created, updated or submitted, and Frappe's REST API, generated automatically from every doctype, lets n8n read and write records back in.

## What has to stay inside Frappe

The failure mode we actually see is business logic migrating into the workflow tool because it was quicker to add a step there than to write it properly in Frappe. Pricing rules, approval hierarchies, anything that determines how a transaction posts to the ledger, all of that needs to live inside Frappe's own hooks and doctype logic, not in an external workflow Frappe has no visibility into.

The reason is the same one behind [why a Stock Entry writes its Stock Ledger Entry and its GL Entry in the same transaction](/methodology): the guarantee that stock and the books agree comes from logic the platform itself enforces. Move that logic into a separate tool and you've quietly recreated the "second version of the truth" problem ERP is supposed to solve, just with a nicer workflow diagram sitting on top of it.

## A pattern that actually holds up

The split that works in practice: n8n handles orchestration across external systems and human-facing steps that don't belong inside an ERP form, notifications, third-party lookups, multi-tool approval chains. Frappe owns every doctype, every transaction, and every rule that decides what a document means to the business. n8n calls into Frappe's API to trigger or record the outcome. It never becomes a second place where "what actually happened" gets decided.

If an automation project starts adding business rules to the workflow tool because it's faster than writing a proper Frappe hook, that's the moment to stop and reconsider where the logic actually belongs.
