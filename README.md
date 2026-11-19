# Med's Leads — Sales Command Center

A professionally redesigned, responsive CRM dashboard built with **Next.js + React**, using your **existing Google Sheets workbook as its database**. No Postgres, Supabase, Firebase, or database migration required.

## Features

- Professional sales dashboard: KPIs, lead-source breakdown, outreach activity chart, priority prospects, follow-up queue.
- Unified lead explorer with source and stage filters, full-text search, score ordering, pages, and CSV export.
- Separate pipelines for **Business prospects**, **Direct opportunities**, and **Job intent**; job-intent leads are not treated as directly contactable.
- Per-lead detail drawer with research caveats, source links, prepared drafts (not sent), status, next action, follow-up date, and internal notes.
- Follow-up queue, outreach timeline, analytics, and connection settings.
- Server-side Google Sheets API, service-account auth, password-protected owner workspace, signed HTTP-only cookie, and no automated messages.
- Optional fictional demo only when DEMO_MODE=true, always behind the admin password. Edit in demo is local-only.

## Your existing database

`GOOGLE_SHEET_ID=1hcn3mnhzcUMkCv8Jf_s149GHQPPCQcBXO72dLCypDs8`

The dashboard reads these tabs without changing their structure:

| Google Sheet tab | What it powers | Writeback |
|---|---|---|
| `PIPELINE` | UK and Dubai business prospects | Column J (stage), L (follow-up), N (next action) |
| `DIRECT CONTACT LEADS` | Independently sourced project opportunities | Column N (stage) |
| `JOB INTENT · BATCH 01` | Job-intent records | Column O (stage), N (next action) |
| `JOB INTENT · BATCH 02` | Job-intent records | Column O (stage), N (next action) |
| `OUTREACH LOG` | Recorded outreach and historical activity | Read-only |
| `CRM UPDATES` | Additional notes/follow-up fields for tabs lacking them | Automatically created on first corresponding write |

**Important:** There are different outreach totals in historical command-center cells and the actual `OUTREACH LOG`. This dashboard shows only the events directly recorded in `OUTREACH LOG`, not a merged or inferred send count. `SENT` means provider accepted; it does not mean delivered or read.

## Run locally

Requires **Node.js 20+**.

```bash
npm install
npm run dev
```

Open http://localhost:3000 after configuring `.env.local`. Set `ADMIN_PASSWORD` and `SESSION_SECRET` even for preview. For fictional preview data set `DEMO_MODE=true` explicitly; otherwise the app fails closed until Google credentials are supplied. Your original Sheet is not altered by preview mode.

## Connect your Google Sheets database

1. In Google Cloud Console, create/select a project.
2. Enable **Google Sheets API** for the project.
3. Create a **service account** and download its JSON credentials (keep them private).
4. Open the existing Sheet, click **Share**, and add the service account email (`client_email`) as **Editor**. Do not set public link sharing.
5. Copy `.env.example` to `.env.local` and fill:

```dotenv
GOOGLE_SHEET_ID=1hcn3mnhzcUMkCv8Jf_s149GHQPPCQcBXO72dLCypDs8
GOOGLE_SERVICE_ACCOUNT_EMAIL=my-crm@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ADMIN_PASSWORD=choose-a-long-random-password
SESSION_SECRET=long-random-hex-secret-generated-with-openssl
```

Use `openssl rand -hex 32` to create `SESSION_SECRET`. Restart `npm run dev`. Open the app and sign in using `ADMIN_PASSWORD`.

**Never upload `.env.local` or your Google service account JSON to GitHub.** Do not make your spreadsheet public. All Google API calls run on the server, and access to real records requires the admin session.

## Deploy

Deploy to a private Vercel or compatible Node.js hosting project. Configure the five environment variables in the hosting provider's **server-side** environment settings, then deploy. Use HTTPS in production. Choose a strong admin password, and avoid reusing it elsewhere. The application **always requires** `ADMIN_PASSWORD` and `SESSION_SECRET`, even without a live Sheets connection. It fails closed if either is missing. Only opt in to fake-data preview with `DEMO_MODE=true`.

## What this app does **not** do

- It does **not** send emails, DMs, WhatsApp messages, or automatically contact leads.
- It does **not** infer that logged messages were delivered or read.
- It does **not** override manual hiring eligibility restrictions. Restricted leads remain visibly flagged; status editing is blocked on restricted records.
- It does **not** scrape new prospects or bypass platform restrictions.
- A service account configuration and hosting deployment are required to make the web app live against the real Sheet. These cannot be bundled into source code without exposing your credentials.

## Local commands

```bash
npm run dev     # local development
npm run lint    # type check
npm run build   # production build
npm start       # serve production build
```

## Project structure

```text
src/
  app/
    page.tsx                  # CRM UI
    globals.css               # responsive visual design system
    api/data/route.ts         # authenticated read from Google Sheets
    api/leads/[id]/route.ts   # authenticated updates to Google Sheets
    api/auth/login/route.ts   # login
    api/auth/logout/route.ts  # logout
  lib/
    auth.ts                   # HMAC session auth
    sheets.ts                 # Sheets source mapping and writes
    types.ts                  # typed CRM entities
    demo.ts                   # fictional preview data
```


## Vercel deployment (one-time setup)

1. In Vercel choose **Add New → Project → Import Git Repository** and select `Medkechad00/med-leads`.
2. Framework preset: **Next.js**. Root directory: `/`. Build command: `npm run build` (automatically detected); output directory: leave default.
3. Set these environment variables under **Settings → Environment Variables**, choosing **Production** and **Preview** appropriately:
   - `GOOGLE_SHEET_ID` — workbook ID from `.env.example`.
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` — the service account `client_email`.
   - `GOOGLE_PRIVATE_KEY` — the complete private key (newlines may be represented with literal `\n`).
   - `ADMIN_PASSWORD` — long unique password; never use `NEXT_PUBLIC_`.
   - `SESSION_SECRET` — at least 24 characters; `openssl rand -hex 32`.
4. Share the **existing** Google Sheet with the service account address as **Editor**; keep access restricted, never public.
5. Deploy, then visit the Vercel URL and sign in. The live dashboard should load your existing lead and outreach tabs. Verify a test change on a safe row before updating other records.

**Deployment status:** Repository source alone is not a live deployment. Vercel account authorization and private environment variables must be configured in Vercel before production will be usable. The app contains no real account secrets.

### Security considerations

- Password validation and signed, HTTP-only, `Secure` (in production), SameSite cookies run on the server.
- All `/api/data` reads and `/api/leads/[id]` writes require an authenticated session, including preview data.
- Server-only Google service account never appears in browser code.
- A best-effort per-instance login rate limit is included. For an internet-facing deployment, also turn on Vercel's platform-level abuse protections / WAF because serverless instances do not share in-memory counters.
- This is a single-owner password gate, **not** a multi-user identity provider. Rotate the password and `SESSION_SECRET` whenever access needs to be revoked.
- Never publish secrets, leads, API responses, `.env.local`, or service account JSON in GitHub or logs.