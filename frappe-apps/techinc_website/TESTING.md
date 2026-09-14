# Compatibility testing

The app is written against the stable Frappe APIs shared by v15 and v16. The
repository's isolated automated verification has been run on:

- Frappe 15.120.1 and ERPNext 15.121.2: installation and all 13 integration
  tests pass.
- Frappe 16.33.1: source compatibility was checked. A full local bench run
  requires Python 3.12; this development machine only has Python 3.11 for the
  bench runtime, so use the commands below on a v16 bench.

```sh
bench --site YOUR_SITE install-app techinc_website
bench --site YOUR_SITE migrate
bench --site YOUR_SITE set-config allow_tests true
bench --site YOUR_SITE run-tests --app techinc_website
```

The integration tests use transactions and create temporary CRM records. Run
them on a staging site, never on production. Before enabling intake, also run
`scripts/check_connection.py` and submit one contact and one assessment from a
staging website.
