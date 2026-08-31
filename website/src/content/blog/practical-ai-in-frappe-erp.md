---
title: "Where AI actually earns its place in an ERP — and where it doesn't yet"
description: "Document extraction, demand forecasting and anomaly detection are real, working use cases inside Frappe. A conversational interface that replaces the ledger is not."
published: 2026-08-19
topic: "AI"
author: "thineth-weerasinghe"
readingMinutes: 7
faq:
  - q: "What are realistic AI use cases inside a Frappe ERP implementation?"
    a: "The use cases that hold up in production are narrow and well-scoped: extracting structured data from supplier invoices and delivery documents, flagging anomalous transactions for review, and forecasting demand or stock requirements from historical transaction data. All of these work because they operate on data the ERP already owns."
  - q: "Should an ERP replace its forms and reports with a conversational AI interface?"
    a: "Not as a wholesale replacement. A conversational layer is useful as an additional way to query data you already trust, but the underlying transactional accuracy — a Purchase Receipt posting the correct Stock Ledger Entry and GL Entry — still has to be guaranteed by the platform's own logic, not inferred by a model."
---
AI in ERP gets pitched two very different ways, and it's worth separating them early, because only one of them is something we'd actually recommend building on right now.

The first pitch is: AI reads the data your ERP already has and does something specific and useful with it. The second is: AI becomes the interface — you ask it questions instead of using forms and reports, and it handles the transactions for you. The first is real and working. The second is not something a business running its actual books should be betting on yet.

## Where it works: narrow, data-grounded tasks

**Document extraction.** Supplier invoices, delivery notes and customs paperwork arrive as PDFs and scanned images with no structure. A model trained to extract line items, quantities and reference numbers from these documents — feeding directly into a Purchase Receipt or Material Request — removes a genuinely tedious, error-prone manual step. This works because the output is checked against a known schema before it's committed, not trusted blindly.

**Anomaly detection.** With years of transaction history sitting in Stock Ledger Entries and GL Entries, a model can flag transactions that deviate from an established pattern — a purchase price that's out of range for that supplier and item, a quantity that doesn't match historical order patterns. This is useful precisely because it's a flag for a human to check, not an automatic action.

**Forecasting.** Demand forecasting and reorder point suggestions, built from historical Sales Order and Stock Ledger data, genuinely improve on the "gut feel and a spreadsheet" baseline most businesses are actually running on today.

## Where it doesn't work yet: replacing the ledger's own guarantees

The reason [a Stock Entry writes its Stock Ledger Entry and its GL Entry in the same transaction](/methodology) is that stock and the books physically cannot disagree — the guarantee comes from the platform's transactional logic, not from anyone's judgment. That property doesn't transfer to a model inferring what should have happened. An AI interface can be a very good way to *query* a system whose numbers you already trust; it isn't yet a substitute for the deterministic logic that makes those numbers trustworthy in the first place.

## The actual question to ask

When AI is proposed as part of an ERP implementation, the useful question isn't "does it use AI" — it's "what specific, bounded task is it doing, and what happens when it's wrong." Document extraction with a human review step has a clear answer. A conversational agent making transactional decisions usually doesn't, yet.
