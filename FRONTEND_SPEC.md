# Nextjobz CRM — Frontend Specification

> This file is the single source of truth for the frontend phase. It was generated
> from the master prompt. Read it before building any screen.

## Scope fence

BUILD (this phase, frontend only):
- Static HTML, CSS and vanilla JavaScript.
- No build step, no npm, no bundler, no framework.
- Must run by opening `index.html` directly in a browser.
- Must work when hosted on GitHub Pages.
- All data comes from a mock layer in `js/api.js`.
- Hash-based routing only (`#/leads`, `#/employers`) because GitHub Pages cannot do
  server-side rewrites.

DO NOT BUILD (belongs to Phase 2):
- No Node server, no Express, no package.json.
- No database.
- No real authentication or password checking.
- No MCP server.
- No email or SMS sending.
- No file uploads to a server.

## Who we are

Nextjobz Limited is a job portal and career platform in Bangladesh, an SBU of
Akij Resource. This CRM is used internally by four teams.

## The four teams

1. **Digital Marketing** — social posting, Meta ads, SEO vendor and creative vendors.
   Sends qualified campaign leads to the CRM team. Needs campaign tracking, cost per
   lead, vendor bill tracking.
2. **CRM Team (contact centre)** — CV support, job posting on request, employer account
   creation, organic lead generation, follow-up calls, replying to Messenger, WhatsApp,
   Hotline and LinkedIn queries. Needs query inbox, job seeker support log, lead routing.
3. **Sales Team** — morning email, follow-up, field visits, job posting support, invoicing,
   visit data entry, meeting scheduling, daily activity report. Needs employers, deals,
   visits, invoices, daily activity report.
4. **Headhunting, Payroll & Staffing** — lead collection, client meetings, proposals for
   RPO/payroll/staffing, JD preparation, job posting, CV sorting/screening, interview
   coordination, payroll operations. Needs recruitment delivery pipeline, proposals,
   payroll clients.

## The central mechanic: lead routing

Leads come in and must be routed to the right team without falling through gaps.

Lead sources: Meta ads, Google ads, organic social, website form, Messenger, WhatsApp,
Hotline call, LinkedIn, referral, field visit, cold call, event, existing data calling,
scrapped job follow-up.

Lead routes to: Sales, Headhunting & Staffing, Payroll, LearningLab, Events.

Every lead must show: creator + when, routed team + when, who accepted it, current status,
days since last activity.

Lead status flow: `new -> assigned -> contacted -> qualified -> converted` or
`-> lost` (with a reason).

Dashboard shows a red "Unrouted Leads" warning box: any lead unrouted for more than 24
hours appears there.

## Service lines (exact dropdown values)

- Job Post - Basic
- Job Post - Premium
- Job Post - Featured
- CV Bank Access
- Employer Branding
- LearningLab Training
- Headhunting / RPO
- Payroll Outsourcing
- Staffing Solution
- Campus Hiring
- Event & Activation

## User roles

`super_admin` (CBO), `admin` (Operations), `sales_head`, `sales_officer`, `crm_lead`,
`crm_officer`, `marketing_officer`, `headhunting_mgr`, `recruiter`, `payroll_officer`,
`events_officer`, `management` (read only).

A "Demo: View As" role switcher lives in the top bar.

## Payroll privacy rule

Payroll data belongs to client companies under contract. Payroll screens show only:
company name, headcount, cycle status, service fee. Never individual employee names or
salary figures. A purple notice: "Client-owned data. Access is logged." Only
`payroll_officer`, `admin`, `super_admin` may open payroll screens.

## Design system

Colours (CSS variables in `css/tokens.css` only, never hard-coded):

| Token        | Value     | Use                                        |
|--------------|-----------|--------------------------------------------|
| `--primary`  | `#6030F0` | purple — header, buttons, active nav, links |
| `--secondary`| `#30F060` | green — success, on-target, converted, paid |
| `--warning`  | `#F0A030` | amber — behind target, pending, due soon    |
| `--danger`   | `#F03060` | red — at risk, overdue, lost, unrouted      |
| `--ink`      | `#1A1A2E` | all text                                   |
| `--ink-soft` | `#6B6B85` | secondary text, labels                     |
| `--bg`       | `#F7F7FB` | page background                            |
| `--card`     | `#FFFFFF` | card background                            |
| `--line`     | `#E8E8F0` | borders                                    |

Typography: 'Plus Jakarta Sans' for UI, 'Noto Sans Bengali' fallback. Base 15px,
headings weight 600, never below 13px.

Layout: left sidebar (collapses to bottom bar on mobile), top bar (page title, search,
demo role switcher, avatar), content max-width 1400px with 24px padding.

Components: card, KPI card (4px left border), button (primary/secondary/danger),
badge/status pill (15% opacity tint), data table (sticky header, zebra, sortable,
stacked cards below 768px), modal, empty state, toast, search box.

## Mobile rules (not optional)

- Test at 360px width.
- Tables become stacked cards below 768px.
- Tap targets minimum 44px tall.
- Bottom navigation bar on mobile with the 5 most-used screens.
- Forms single column on mobile.
- No horizontal page scroll, ever.

## Language rules

- Simple English, short words.
- Buttons say what they do ("Add New Employer").
- Money always BDT, South Asian grouping: `BDT 1,50,000`.
- Dates on screen: `11 Aug 2026`. Stored: `2026-08-11`.
- Phone: 11 digits starting `01`.
- Never show a raw error. Say: "Could not save. Check your internet and try again."
- Every empty list tells the user what to do next.

## File structure

```
index.html
/css
  tokens.css
  base.css
  components.css
/js
  config.js
  api.js
  mock-data.js
  router.js
  components.js
  utils.js
  auth.js
/pages
  one .js file per screen
README.md
```

## API layer rule (most important technical rule)

No page file may touch `mock-data.js` directly. Every page calls `api.js`.

`api.js` exposes for every entity:

```
api.leads.list(filters)
api.leads.get(id)
api.leads.create(data)
api.leads.update(id, data)
api.leads.remove(id)
```

Each function checks `CONFIG.API_MODE`:
- `'mock'` -> read/write `localStorage`, seeded from `mock-data.js`.
- `'live'` -> `fetch(CONFIG.API_BASE_URL + '/api/leads')`.

Every function returns a Promise (even mock) with a 200ms delay so loading states are
visible. The `live` branch is written now even though no backend exists.

## Mock data rules

Public repo, so: fake company names ("Demo Textiles Ltd"), phone `01700000001`-style,
emails `contact1@example.com`, person names "Officer One". Capital comment at top of
`mock-data.js`: this file must never contain real client data.

Seed roughly: 25 employers, 40 leads, 20 deals, 30 visits, 15 orders, 20 collections,
25 queries, 10 campaigns, 8 requirements, 6 payroll clients.

## Build order (incremental)

1. Full file structure + design system (tokens/base/components CSS).
2. `config.js`, `api.js` (mock + live), `mock-data.js`, `router.js`, `components.js`,
   `utils.js`, `auth.js`.
3. `index.html` with sidebar, top bar, role switcher, and a working Dashboard with KPI cards.
4. Then screens one at a time: Leads, Employers/Contacts, Deals/Sales/Collections,
   Visits/Daily Report, Queries/Job Seeker Support, Requirements/Proposals, Payroll,
   Marketing/Vendors/Events, Targets/Reports + polish.
