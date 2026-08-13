# Nextjobz CRM — Frontend

Static frontend for the Nextjobz Limited internal CRM (an SBU of Akij Resource).
Built with plain HTML, CSS and vanilla JavaScript — no build step, no framework,
no npm. It runs by opening `index.html` directly in a browser and works on
GitHub Pages.

> **Demo data only.** Every name, phone number and company in this app is fake.
> This is a design/demo frontend. Real records arrive in Phase 2 via the backend.

## Run it locally

Open the file in your browser:

```bash
open index.html
```

Or serve it with any static server (optional):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Demo: switch role

Use the **"Demo: View As"** dropdown in the top bar to preview each role
(super admin, sales officer, CRM lead, payroll officer, etc.) without logging in.
The sidebar, mobile nav and every screen react to the selected role, including
the payroll privacy gate.

## How it is built

- **Hash routing** (`#/leads`, `#/employers`) because GitHub Pages cannot do
  server-side rewrites.
- **One data layer**: `js/api.js` is the *only* place data is read or written.
  Pages never touch `js/mock-data.js` directly.
- **Mock mode**: data lives in the browser's `localStorage`, seeded once from
  `js/mock-data.js`. Every call returns a Promise with a 200 ms delay so loading
  states behave like a real backend.

## File structure

```
index.html              single page shell + hash router mount point
css/
  tokens.css            CSS variables only (all colours live here)
  base.css              reset, typography, layout, responsive shell
  components.css        cards, buttons, tables, badges, modals, forms
js/
  config.js             API_MODE + API_BASE_URL  ← edit this to go live
  api.js                THE ONLY data layer (mock now, REST later)
  mock-data.js          fake seed data (must never contain real client data)
  router.js             hash routing
  components.js         reusable UI builders + app shell
  utils.js              formatting helpers (BDT, dates, phone, badges)
  auth.js               demo role switching + screen permissions
pages/
  one .js file per screen
FRONTEND_SPEC.md        the full written specification
```

## Going live (Phase 2)

When the backend is ready, change **exactly two lines** in `js/config.js`:

```js
const CONFIG = {
  API_MODE: 'mock',                            // ← change to 'live'
  API_BASE_URL: 'https://api.nextjobz.com.bd'  // ← your backend URL
};
```

Nothing else in the frontend changes. Every page already calls `api.js`, and
`api.js` already has the `live` (REST) branch written for every entity — it
calls `CONFIG.API_BASE_URL + '/api/<entity>'`.

The backend must return the exact field shapes defined in `js/mock-data.js`
(that file doubles as the data contract). See `FRONTEND_SPEC.md` for the full
specification.
