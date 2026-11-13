import { createServer } from 'node:http';
import { createAiRequestHandler } from './ai-api.js';

const port = Number(process.env.AI_SERVER_PORT || 3001);
const host = process.env.AI_SERVER_HOST || '127.0.0.1';
const allowedOrigins = (process.env.AI_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const handler = createAiRequestHandler({
  apiKey: process.env.OPENAI_API_KEY || '',
  model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
  allowedOrigins,
});

createServer((request, response) => {
  const path = (request.url || '/').split('?')[0];
  if (path === '/api/analyze-feedback') request.url = path.slice('/api'.length);
  else if (path === '/api/health') request.url = '/health';
  handler(request, response);
}).listen(port, host, () => {
  console.log(`Feedback AI server listening at http://${host}:${port}`);
  if (!process.env.OPENAI_API_KEY) console.warn('OPENAI_API_KEY is missing; rating analysis requests will return a setup error.');
});
