# Deploying to Vercel

The Astro site lives in `website/`. The repo is set up so a deploy works whether
Vercel's **Root Directory** is the repo root or `website/` — but they take
different paths, so it is worth knowing which one you are on.

## Why the first deploy 404'd

Two things, either of which produces a green build followed by
`404: NOT_FOUND` at the edge:

1. **The wrong adapter.** The project was on `@astrojs/node`, which emits a
   standalone Node server in `dist/`. Vercel does not know how to serve that —
   it looks for the Build Output API layout in `.vercel/output`. Now on
   `@astrojs/vercel`, which emits exactly that.
2. **The app is in a subdirectory.** With Root Directory at the repo root and no
   configuration, Vercel found no framework and published nothing.

## Recommended setup

Set **Project → Settings → General → Root Directory** to `website`.

Vercel then auto-detects Astro, reads `website/vercel.json`, and everything else
is automatic. This is the standard layout and the one to prefer.

## If Root Directory stays at the repo root

The `vercel.json` at the repo root handles it: it installs and builds inside
`website/`, then moves `website/.vercel/output` up to `.vercel/output` where
Vercel expects it. Nothing to configure, but there is one more moving part than
the option above.

## Environment variables — required

Set all four under **Project → Settings → Environment Variables**, scoped to
**Production** (and Preview, if you want the forms live there):

| Variable | What it is |
|---|---|
| `FRAPPE_URL` | Base URL of the bench running `techinc_website`, no trailing slash |
| `FRAPPE_API_KEY` | API key for a user with the **Website Manager TI** role |
| `FRAPPE_API_SECRET` | Its secret |
| `WEBSITE_INTAKE_SECRET` | Must match *Website Settings TI → Intake secret* in Frappe |

Two things that will bite otherwise:

- **`FRAPPE_URL` must be reachable from the public internet.** A
  `*.localhost` address works on your machine and fails in production. The bench
  needs a real hostname and TLS before the forms will work from the deployed
  site.
- **Adding a variable does not update a running deployment.** They are read at
  request time, but the function still has to be redeployed to pick up a new
  environment. Redeploy after changing any of them.

Without these, pages render fine and every form returns *"The backend is not
configured yet."* — deliberately, rather than failing silently.

## What is served how

- **37 static pages**, prerendered at build time.
- **One serverless function** (`_render`) handling `/api/contact`,
  `/api/ticket`, `/api/assessment` and `/api/analytics`. These are the only
  routes that run on demand, which is what keeps the Frappe key off the client.
- `robots.txt`, `llms.txt`, `llms-full.txt`, `company.json` and the `/md/*`
  markdown mirrors are static, with cache headers set in `website/vercel.json`.

## Verifying a deploy

```bash
curl -sI https://your-domain/                 # 200
curl -s  https://your-domain/llms.txt | head  # the LLM index
curl -s https://your-domain/api/contact \
  -H 'content-type: application/json' \
  -d '{"name":"Test","email":"t@example.com","message":"Checking the wiring.","elapsed":9000}'
```

The last one should return `{"ok":true,"reference":"WEB-ENQ-…"}` and the enquiry
should appear in the Frappe console at `/techinc`. If it returns *"backend is not
configured"*, the environment variables are missing or the deployment predates
them.

## Local

```bash
cd website
cp .env.example .env    # fill in the four values
npm install
npm run dev
```
