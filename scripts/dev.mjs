/**
 * `npm run dev` — starts the API server (port 4000, auto-restart on change), waits until it
 * answers /api/health, then starts Vite (port 5173). Starting in this order avoids the
 * harmless-but-noisy "ws proxy error: ECONNREFUSED 127.0.0.1:4000" on startup.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const envFlag = fs.existsSync('.env') ? ['--env-file=.env'] : [];
const isWin = process.platform === 'win32';
const apiPort = Number(process.env.API_PORT || process.env.PORT || 4000);
const health = `http://127.0.0.1:${apiPort}/api/health`;

const procs = [];
let stopping = false;
const stop = (code = 0) => {
  if (stopping) return;
  stopping = true;
  procs.forEach((p) => { try { p.kill(); } catch { /* already gone */ } });
  process.exit(code);
};
const track = (p) => { procs.push(p); p.on('exit', (code) => stop(code ?? 0)); return p; };
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

track(spawn(process.execPath, [...envFlag, '--watch-path=server', '--watch-path=src/data', 'server/index.js'], { stdio: 'inherit' }));

/** Poll the API for up to 20 s; start Vite either way so a slow API never blocks the UI. */
async function waitForApi() {
  for (let i = 0; i < 80 && !stopping; i += 1) {
    try {
      const res = await fetch(health);
      if (res.ok) return true;
    } catch { /* not listening yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

const ready = await waitForApi();
if (!stopping) {
  if (!ready) console.warn(`API did not answer ${health} within 20 s — starting Vite anyway; it will reconnect when the API is up.`);
  track(spawn(isWin ? 'npx.cmd' : 'npx', ['vite', '--host', '127.0.0.1'], { stdio: 'inherit', shell: isWin }));
}
