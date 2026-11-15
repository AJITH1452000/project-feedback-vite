# ProFeed — Performance & Project Feedback

React + Vite + MUI frontend with its own Node API server (Express + Socket.IO). Real email/password accounts, role-based access (employee, manager, optional HR/Admin), goal setting & appraisal workflow, project reviews, live updates and notifications. No sample data — you start with an empty workspace.

## Run

```bash
npm install
npm run dev          # API on :4000 + app on http://127.0.0.1:5173
```

1. Open http://127.0.0.1:5173 — the first visit shows **Set up your workspace**. Create the first account (Manager or HR/Admin).
2. Go to **People & access** → **Add person** to create accounts for your team (each gets a temporary password to share privately).
3. Team members sign in with their email + temporary password and can change it in **Settings → Password**.

To see real-time updates, sign in as two different people in two different browsers (or one normal + one private window — tabs in the same browser share the same session).

| Command | What it does |
|---|---|
| `npm run dev` | API server (auto-restarts on change) + Vite dev server |
| `npm run dev:api` / `npm run dev:web` | Run only one of them |
| `npm run db:reset` | Delete all data (stop the server first; next visit shows the setup screen again) |
| `npm run db:sample` | Small example on an empty workspace: 1 project, 3 team members, a rating each and approved goals (password `Welcome@123`) |
| `npm run db:seed` | Fill an empty workspace with realistic test data via the API (server must be running). All test accounts use `Welcome@123` |
| `npm run build` then `NODE_ENV=production npm start` | Production: the API server also serves the built app |

Data is stored in `server/data/db.json` (git-ignored). Optional settings are in `.env.example`.

## How it works

- **Auth** — scrypt-hashed passwords, opaque session token in an `HttpOnly` cookie (7 days), CSRF header check, login rate limiting. Signing out, resetting a password or deactivating a user ends their sessions and live connections immediately; tabs stay in sync.
- **Real-time** — Socket.IO authenticates with the same cookie. Every write is pushed to the people involved (employee, their manager, HR) and creates a notification.
- **Frontend data** — `src/services/api.js` is a plain HTTP client; React Query caches the workspace (`src/hooks/queries`) and socket events update the cache.
- **Rules shared by browser and server** — `src/data/constants.js` (configuration) and `src/data/goals.js` (goal workflow rules) are imported by both, so validation always matches.

## API

All paths are under `/api`. Mutating requests need the header `X-Requested-With: XMLHttpRequest`.

| Purpose | Method & path |
|---|---|
| First-run setup | `GET /auth/setup` → `{ needsSetup }` · `POST /auth/setup` |
| Sign in / out / session | `POST /auth/login` `{ email, password }` · `POST /auth/logout` · `GET /auth/me` |
| Change own password | `POST /auth/password` `{ current, next }` |
| People | `GET /users` (active employees) · `GET /users/directory` · `POST /users` · `PATCH /users/:id` |
| Projects | `GET /projects` · `POST /projects` |
| Reviews | `GET /reviews` · `POST /reviews` · `GET /reviews/history` |
| Goals | `GET /goals` · `POST /goals` · `PATCH /goals/:id` · `DELETE /goals/:id` · `POST /goals/:id/:action` |
| Goal plans | `GET /goal-plans` · `POST /goal-plans/:userId/:period/:action` |
| Notifications | `GET /notifications` · `POST /notifications/read` `{ ids }` |
| Settings | `GET /settings/review` · `PUT /settings/review` |
| AI rating suggestion | `POST /ai/analyze` (OpenAI if `OPENAI_API_KEY` is set, otherwise a built-in analyser) |

Roles are enforced on the server: employees see only their own goals and reviews; managers see and act on their direct reports; HR sees everyone and can only act in the optional final-review step.

## Project structure

```text
server/                 API server
  index.js              Express app, routes, error handling, Socket.IO
  auth.js · realtime.js sessions & guards · live events & notifications
  db.js                 JSON-file database (swap for MySQL/Postgres later)
  routes/               auth, users, workspace (projects/reviews/settings), goals
src/
  app/App.jsx           routes, role guards, lazy pages
  services/api.js       HTTP client
  hooks/queries/        React Query cache + mutations
  context/              auth, workspace data + socket, theme, toasts
  data/constants.js     configuration shared with the server
  data/goals.js         goal workflow rules shared with the server
  pages/ · components/  UI
  theme/ · styles/      design tokens and sx style maps
legacy-ui/              previous UI, kept for reference (not built)
```

## Styling rules

- No hex/rgb colors or font names in components or `sx` — add a token in `src/theme/tokens.js`, then reference it.
- Breakpoints: `xs 0` · `sm 480` · `md 768` · `lg 1024` · `xl 1280` · `xxl 1600`.
- Every page is code-split with `React.lazy` and shows the branded `PageLoader` while loading.
