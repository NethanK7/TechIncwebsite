---
title: "EPF, ETF and VAT: what Sri Lankan payroll and finance actually need from an ERP"
description: "Statutory compliance isn't a report you bolt on at month-end. It has to be a property of how payroll and finance are configured from the start."
published: 2026-08-12
topic: "Finance & Payroll"
author: "niluka-dilrukshi"
readingMinutes: 6
faq:
  - q: "Does Frappe ERP handle EPF and ETF for Sri Lankan payroll?"
    a: "Yes. EPF and ETF contributions are configured as part of the salary structure so they compute and post to the general ledger automatically on every payroll run, rather than being calculated separately and journalled in afterward."
  - q: "How is Sri Lankan VAT handled in Frappe ERP finance?"
    a: "VAT gets configured natively against the chart of accounts and tax templates at implementation time, so every sales and purchase transaction carries the correct tax treatment automatically instead of relying on a manual adjustment before filing."
---
A payroll run and a VAT filing look like two different problems, and most ERP conversations treat them that way. Payroll gets its own module, tax gets bolted onto finance separately. In practice they share the same failure mode: both are only correct if the underlying configuration was built for Sri Lankan requirements from day one, not adapted to them afterward.

## Payroll: where EPF and ETF actually belong

EPF (8% employee, 12% employer) and ETF (3% employer) aren't a report you generate at month-end. They're a property of the salary structure itself. When contributions are configured as components of that structure, every payroll run computes them automatically and posts them straight to the general ledger. Get this wrong at setup and the symptom isn't dramatic. It's a finance team quietly re-checking every payroll run by hand, every month, for as long as nobody fixes it.

The same goes for gratuity provisioning and the other statutory obligations that sit alongside EPF and ETF. They need to be configured as part of the payroll structure, not maintained in a spreadsheet next to the system.

## VAT: the same idea, on the finance side

Sri Lankan VAT treatment needs to be native to the chart of accounts and tax templates, not a manual adjustment made right before filing. When a sales or purchase transaction gets entered, the correct tax treatment should already be attached to it, because the item, the customer and the tax template agreed on it at the point of entry, not because someone remembered to check afterward.

This matters more than it sounds like it should, because the cost of getting it wrong doesn't show up immediately. It shows up at the filing deadline, as a reconciliation exercise between what the system recorded and what the return actually needs to say.

## Why this has to be day-one configuration

Retrofitting statutory compliance into a system that wasn't built for it means touching historical transactions, chart-of-accounts structure and payroll components that are already live. That's always harder and riskier than getting it right during implementation. It's the same reasoning behind [treating an ASYCUDA customs integration as a scoped deliverable rather than a late add-on](/case-studies/emjay-international): compliance requirements that are structural to how the business works have to be designed in, not patched on afterward.

If you're evaluating an ERP implementation and statutory compliance gets described as "a report we can build later," treat that as worth asking more about. The report isn't the hard part. The underlying configuration is.
