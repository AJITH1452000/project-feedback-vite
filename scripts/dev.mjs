/** `npm run dev` — starts the API server (port 4000, auto-restart on change) and Vite (port 5173) together. */
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const envFlag = fs.existsSync('.env') ? ['--env-file=.env'] : [];
const isWin = process.platform === 'win32';

const procs = [
  spawn(process.execPath, [...envFlag, '--watch-path=server', '--watch-path=src/data', 'server/index.js'], { stdio: 'inherit' }),
  spawn(isWin ? 'npx.cmd' : 'npx', ['vite', '--host', '127.0.0.1'], { stdio: 'inherit', shell: isWin }),
];

let stopping = false;
const stop = (code = 0) => {
  if (stopping) return;
  stopping = true;
  procs.forEach((p) => { try { p.kill(); } catch { /* already gone */ } });
  process.exit(code);
};
procs.forEach((p) => p.on('exit', (code) => stop(code ?? 0)));
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
