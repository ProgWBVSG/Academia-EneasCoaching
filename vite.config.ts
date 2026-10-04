import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// En desarrollo, sirve /api/academia con el mismo handler que usa Vercel en
// producción, así se prueba todo con `npm run dev` sin instalar vercel dev.
function apiLocal(): Plugin {
  return {
    name: 'api-local',
    configureServer(server) {
      server.middlewares.use('/api/academia', async (req, res) => {
        const url = new URL(req.url || '', 'http://localhost');
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const raw = Buffer.concat(chunks).toString('utf8');

        const vreq: any = Object.assign(req, {
          query: Object.fromEntries(url.searchParams),
          body: raw ? JSON.parse(raw) : {},
          rawBody: raw,
        });
        const vres: any = Object.assign(res, {
          status(code: number) { res.statusCode = code; return vres; },
          json(data: unknown) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return vres;
          },
        });

        try {
          const mod = await server.ssrLoadModule('/api/academia.js');
          await mod.default(vreq, vres);
        } catch (e) {
          console.error(e);
          if (!res.headersSent) vres.status(500).json({ error: 'Error del servidor local' });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Las variables se leen de la carpeta del proyecto aunque vite se lance desde otra
  const raiz = path.dirname(fileURLToPath(import.meta.url));
  Object.assign(process.env, loadEnv(mode, raiz, ''));
  return {
    plugins: [react(), tailwindcss(), apiLocal()],
    server: { port: 5240 },
  };
});
