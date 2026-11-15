/**
 * File-backed JSON database. Everything lives in server/data/db.json (git-ignored),
 * so data survives page reloads and server restarts. Writes are atomic (temp file + rename).
 * Swap this module for MySQL/Postgres later without touching the routes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_REVIEW_SETTINGS } from '../src/data/constants.js';

const DATA_DIR = process.env.DATA_DIR || fileURLToPath(new URL('./data/', import.meta.url));
export const DB_FILE = path.join(DATA_DIR, 'db.json');

const empty = () => ({
  meta: { schema: 1, createdAt: new Date().toISOString() },
  counters: {},
  users: [],
  sessions: [],
  projects: [],
  reviews: [],
  history: [],
  signals: [],
  notifications: [],
  settings: { ...DEFAULT_REVIEW_SETTINGS },
  goals: [],
  goalPlans: [],
});

function load() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return { ...empty(), ...JSON.parse(raw) };
  } catch (err) {
    if (err.code !== 'ENOENT') console.error(`Could not read ${DB_FILE}:`, err.message);
    return empty();
  }
}

let db = load();

export const getDb = () => db;

export function persist() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

/** Auto-increment ids per collection. */
export function nextId(collection) {
  db.counters[collection] = (db.counters[collection] || 0) + 1;
  return db.counters[collection];
}

/** Insert or replace a record by id. */
export function save(collection, record) {
  const list = db[collection];
  const i = list.findIndex((x) => x.id === record.id);
  if (i === -1) list.push(record);
  else list[i] = record;
  return record;
}

export function remove(collection, id) {
  db[collection] = db[collection].filter((x) => x.id !== id);
}

export function resetDatabase() {
  db = empty();
  persist();
}
