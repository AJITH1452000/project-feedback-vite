/**
 * ProFeed API server — Express + Socket.IO, data stored in server/data/db.json.
 *
 *   npm run dev       → this server (port 4000) + Vite (port 5173, proxies /api and /socket.io here)
 *   npm run dev:api   → this server only, restarts on file changes
 *   npm run db:reset  → wipe all data (next visit shows "create the first account")
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { analyzeFeedback } from '../ai-api.js';
import { heuristicAnalysis } from '../src/services/ratingHeuristic.js';
import { authenticate, csrfGuard } from './auth.js';
import { DB_FILE } from './db.js';
import { HttpError } from './http.js';
import { attachRealtime } from './realtime.js';
import { authRouter } from './routes/auth.js';
import { cyclesRouter } from './routes/cycles.js';
import { goalsRouter } from './routes/goals.js';
import { usersRouter } from './routes/users.js';
import { workspaceRouter } from './routes/workspace.js';

const PORT = Number(process.env.API_PORT || process.env.PORT || 4000);
const HOST = process.env.API_HOST || '127.0.0.1';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 'loopback');
app.use((_req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'Cache-Control': 'no-store' });
  next();
});
app.use('/api', express.json({ limit: '100kb' }), authenticate, csrfGuard);

/* ------------------------------- Routes -------------------------------- */
app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api', workspaceRouter);
app.use('/api', cyclesRouter);
app.use('/api', goalsRouter);

/* ---------------------------- AI suggestions --------------------------- */
/** OpenAI when OPENAI_API_KEY is set; otherwise (or if it fails) the built-in rule-based analyser. */
app.post('/api/ai/analyze', async (req, res, next) => {
  if (!req.user) return next(new HttpError(401, 'Please sign in.'));
  const strengths = String(req.body?.strengths || '').slice(0, 5000);
  const developmentAreas = String(req.body?.developmentAreas || '').slice(0, 5000);
  if (!strengths.trim() && !developmentAreas.trim()) return next(new HttpError(400, 'Add feedback text before requesting a rating.'));
  if (process.env.OPENAI_API_KEY) {
    try {
      const result = await analyzeFeedback(strengths, developmentAreas, process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL || 'gpt-4.1-mini');
      return res.json({ ...result, source: 'openai' });
    } catch (err) {
      console.warn('OpenAI analysis failed, using the built-in analyser:', err.message);
    }
  }
  return res.json(heuristicAnalysis({ strengths, developmentAreas }));
});

app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Endpoint not found.')));

/* ---------------------- Production: serve the SPA ---------------------- */
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(dist, 'index.html'))) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

/* ---------------------------- Error handler ---------------------------- */
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 ? 'Something went wrong on the server.' : err.message });
});

const server = http.createServer(app);
attachRealtime(server);
server.listen(PORT, HOST, () => {
  console.log(`ProFeed API listening on http://${HOST}:${PORT}`);
  console.log(`Data file: ${DB_FILE}`);
});
