import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { createAiRequestHandler } from './ai-api.js';

function feedbackAiPlugin(env) {
  const handler = createAiRequestHandler({
    apiKey: env.OPENAI_API_KEY || '',
    model: env.OPENAI_MODEL || 'gpt-4.1-mini',
    allowedOrigins: (env.AI_ALLOWED_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  });
  // Only the AI route is handled here; every other /api request falls through to the backend proxy.
  const aiOnly = (req, res, next) => (req.url?.startsWith('/analyze-feedback') ? handler(req, res, next) : next());
  return {
    name: 'profeed-feedback-ai',
    configureServer(server) {
      server.middlewares.use('/api', aiOnly);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api', aiOnly);
    },
  };
}

/**
 * Dev/preview proxy → ProFeed backend (separate project, default http://127.0.0.1:4000).
 * The browser talks to one origin, so the HttpOnly session cookie and WebSocket work without CORS issues.
 */
function backendProxy(env) {
  const target = env.API_PROXY_TARGET || 'http://127.0.0.1:4000';
  return {
    '/api': { target, changeOrigin: false },
    '/socket.io': { target, ws: true, changeOrigin: false },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  plugins: [
    react(),
    feedbackAiPlugin(env),
  ],
  server: { port: 5173, host: '127.0.0.1', proxy: backendProxy(env) },
  preview: { port: 4173, host: '127.0.0.1', proxy: backendProxy(env) },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@mui/x-charts') || id.includes('d3-') || id.includes('@mui/x-internals')) return 'vendor-charts';
          if (id.includes('@mui') || id.includes('@emotion')) return 'vendor-mui';
          if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'vendor-react';
          if (id.includes('lucide-react')) return 'vendor-icons';
          return undefined;
        },
      },
    },
  },
  };
});
