/** `npm run db:reset` — deletes all data. The next visit shows "Create the first account". */
import fs from 'node:fs';
import { DB_FILE } from './db.js';

if (fs.existsSync(DB_FILE)) {
  fs.rmSync(DB_FILE);
  console.log(`Deleted ${DB_FILE}. Restart the API server; the next visit will ask you to create the first account.`);
} else {
  console.log('No data file yet — nothing to reset.');
}
