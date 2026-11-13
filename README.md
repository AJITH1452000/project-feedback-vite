# ProFeed — Project Feedback System

React + Vite + MUI workspace for project managers and employees: role-based login, executive dashboard, projects & teams, project reviews (with AI rating suggestions), people & skills risk, reports, settings and a personal performance profile.

## Run

```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run build && npm run preview
```

## Run with the real backend (MySQL + real-time)

The backend is a separate project: `D:\NEW UI PROJECT FEDBACK SYSTEM\profeed-backend` (see its README).

```powershell
# Terminal 1 — backend (after installing MySQL and running `npm run db:setup` once)
cd "D:\NEW UI PROJECT FEDBACK SYSTEM\profeed-backend"; npm run dev

# Terminal 2 — frontend
cd "D:\NEW UI PROJECT FEDBACK SYSTEM\project-feedback-vite\project-feedback-vite"
Copy-Item .env.example .env      # contains VITE_API_URL=/api
npm run dev                      # sign in as manager@profeed.local / ProFeed@123
```

Set `VITE_API_URL` in `.env` (not inline in Git Bash, which rewrites `/api` into a Windows path).
The footer shows **Live · real-time updates on** when the socket is connected. Remove the `VITE_API_URL` value to return to demo mode.

## Backend connection

All data access lives in **`src/services/api.js`**; real-time events are handled in `src/context/DataContext.jsx`.

- `VITE_API_URL` empty → **demo mode**: in-memory sample data (identical shape to the backend), kept for the current browser tab.
- `VITE_API_URL=https://your-backend/api` → every call goes to the backend with `credentials: 'include'` (cookie session). Responses may be raw JSON or `{ data: ... }`.

Endpoints (edit `ENDPOINTS` in `api.js` to match your backend):

| Purpose | Method & path | Body / response |
|---|---|---|
| Sign in | `POST /auth/login` | `{ email, password }` → `{ role, userId, name, title, track }` (demo mode uses a role picker instead) |
| Sign out | `POST /auth/logout` | — |
| Current session | `GET /auth/me` | user or 401 |
| Projects | `GET /projects` | `[{ id, n, c, pr, s, e, t:[userIds] }]` |
| Users | `GET /users` | `[{ id, n, r, t }]` |
| Reviews | `GET /reviews` | `[{ id, p, u, by, s:[4 scores], f:[flags], note, d }]` |
| Create review | `POST /reviews` | `{ review, meta }` → `{ review, historyItem }` |
| Review history | `GET /reviews/history` | `[{ id, employee, project, period, rating, status, role, date }]` |
| AI signals | `GET /insights/signals`, `PATCH /insights/signals/:id` | signal objects |
| Notifications | `GET /notifications`, `POST /notifications/read` | `{ ids }` |
| Review settings | `GET/PUT /settings/review` | `{ cycle, visibility, safeguardRequired, reminders }` |

The backend must enforce roles: employees may only read their own reviews; only managers may create reviews or change settings. UI hiding is not security.

## Project structure

```text
src/
  app/App.jsx            routes, role guards, lazy pages + Suspense
  config/navigation.js   menu + page titles per role
  context/               auth, workspace data, theme mode, toasts
  services/api.js        backend / demo data layer
  data/seed.js           demo data (backend shape) · selectors.js helpers
  theme/tokens.js        ALL colors, fonts, radii, breakpoints (only place raw values live)
  theme/theme.js         MUI theme built from tokens (light + dark)
  styles/*.js            sx style maps — reference the theme only
  components/            layout shell, shared UI, review dialog
  pages/                 auth, dashboard, projects, feedback, people, reports, settings, profile
legacy-ui/               previous UI, kept for reference (not built)
```

## Styling rules

- No hex/rgb colors or font names in components or `sx` — add a token in `src/theme/tokens.js`, then reference it (`'text.secondary'`, `theme.palette.brand.gradient`, …).
- Breakpoints: `xs 0` small phones · `sm 480` large phones · `md 768` tablets · `lg 1024` tablet landscape/laptop · `xl 1280` desktop · `xxl 1600` large desktop.
- Every page is code-split with `React.lazy` and shows the branded `PageLoader` while loading.

## AI rating suggestions

`/api/analyze-feedback` is served by Vite (dev/preview) or `npm run dev:ai`. Add `OPENAI_API_KEY` to `.env` (server-side only). Only the rationale and growth-action text is sent. Suggestions are advisory; managers apply them manually.
