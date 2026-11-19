import { randomBytes } from 'node:crypto';
import { MAX_MARKDOWN_BYTES, parseMarkdownCv } from '../src/cv/markdownCv.js';

export const SHARE_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const CAPACITY = 100;

export function localCvShares() {
  const records = new Map();

  function mount(server) {
    server.httpServer?.once('close', () => {
      for (const record of records.values()) clearTimeout(record.timer);
      records.clear();
    });
    server.middlewares.use('/api/cv-shares', async (req, res) => {
      const send = (status, body) => {
        res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify(body));
      };
      const path = req.url.split('?')[0];
      if (req.method === 'GET' && /^\/[a-f0-9]{32}$/.test(path)) {
        const id = path.slice(1);
        const record = records.get(id);
        if (!record || Date.now() >= record.expiresAt) {
          clearTimeout(record?.timer);
          records.delete(id);
          return send(404, { error: 'Deze CV-link is verlopen of bestaat niet.' });
        }
        return send(200, { cv: record.cv, expiresAt: record.expiresAt });
      }
      if (req.method !== 'POST' || (path !== '/' && path !== '')) return send(404, { error: 'Onbekende route.' });
      const origin = req.headers.origin;
      if (origin && !['http', 'https'].some((scheme) => origin === `${scheme}://${req.headers.host}`)) {
        return send(403, { error: 'Maak de link vanuit de startpagina.' });
      }
      if (req.headers['content-type']?.split(';')[0] !== 'text/plain') {
        return send(415, { error: 'Stuur het cv als Markdown-tekst.' });
      }
      try {
        const chunks = [];
        let size = 0;
        for await (const chunk of req.iterator({ destroyOnReturn: false })) {
          size += chunk.length;
          if (size > MAX_MARKDOWN_BYTES) {
            req.resume();
            return send(413, { error: 'Het bestand is groter dan 64 KB.' });
          }
          chunks.push(chunk);
        }
        const cv = parseMarkdownCv(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)));
        if (records.size >= CAPACITY) return send(503, { error: 'De lokale opslag is vol.' });
        const id = randomBytes(16).toString('hex');
        const expiresAt = Date.now() + SHARE_LIFETIME_MS;
        const timer = setTimeout(() => records.delete(id), SHARE_LIFETIME_MS).unref();
        records.set(id, { cv, expiresAt, timer });
        return send(201, { id, expiresAt });
      } catch (error) {
        if (!res.destroyed) send(400, { error: error instanceof TypeError ? 'Gebruik een bestand met UTF-8-tekst.' : error.message });
      }
    });
  }

  return { name: 'local-cv-shares', configureServer: mount, configurePreviewServer: mount };
}
