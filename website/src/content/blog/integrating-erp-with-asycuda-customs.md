---
title: "Integrating an ERP with ASYCUDA: what actually has to be true"
description: "Customs connectivity isn't a bolt-on feature. It has to sit on the same transaction data as manufacturing and stock, or the declaration is a second version of the truth."
published: 2026-07-08
topic: "Integration"
author: "jeby-krishoan"
readingMinutes: 6
faq:
  - q: "What does it take to integrate an ERP with ASYCUDA for customs declarations?"
    a: "A working ASYCUDA integration needs customs declarations to draw from live transaction data — the same Purchase Order, Purchase Receipt and Stock Entry records the rest of the business uses — rather than a parallel data set re-keyed for compliance. That means the integration is scoped and tested as its own deliverable, not treated as a late add-on."
  - q: "Should logistics and manufacturing run on separate systems?"
    a: "No, if they belong to the same operation. When logistics is solved in isolation from the manufacturing system already running the business, the disconnect between them doesn't disappear — it just relocates to wherever the two systems have to be reconciled by hand."
---
A logistics requirement that also has to speak to customs is really two requirements wearing one name. Most attempts to solve it treat the two as sequential: get logistics working, then figure out customs. That ordering is what makes the project drag for years.

We saw this directly with [Emjay International](/case-studies/emjay-international), a Sri Lankan manufacturer that had been trying to build a complete logistics solution for several years before the requirement was delivered. The reason it hadn't landed wasn't a lack of effort — it was that logistics was never a single process. It had to sit alongside the manufacturing solution already running the business, and it had to speak to ASYCUDA for customs declarations. A solution that solved either half on its own would simply move the disconnect somewhere else.

## Treat both integration boundaries as scoped deliverables

The fix is structural, not technical. Instead of building logistics first and bolting customs connectivity on afterward — which is where most attempts stall — both integration boundaries get scoped, estimated and accepted as their own deliverables from week one, under the same NXTGEN Agile methodology used for every other module.

That has two direct consequences:

- **The link into the existing manufacturing solution gives production and logistics one operational picture.** There is no second stock position to reconcile against.
- **ASYCUDA connectivity means customs declarations draw from live transaction data instead of re-keyed spreadsheets.** The declaration is not a summary somebody typed up from memory; it's the same Purchase Order and Purchase Receipt data the warehouse is already looking at.

## Why this holds up after go-live

Emjay's solution went live within eight months and has since carried large transaction volumes without a major issue since the day it went live. That durability is the actual test of an integration like this — not whether the demo works, but whether declarations still reconcile cleanly a year in, once volume is real and nobody is watching the integration as closely as they were during UAT.

If your logistics requirement also has a customs, regulatory or licensing integration attached to it, the question worth asking a vendor early is whether that integration is scoped as its own deliverable with its own acceptance criteria — or whether it's an assumption sitting quietly at the end of the project plan.
