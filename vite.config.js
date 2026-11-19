import { defineConfig } from 'vite';
import { localCvShares } from './server/localCvShares.js';
import { CV_DIR, readCvs, cvToMarkdown, llmsTxt, llmsFullTxt } from './scripts/cv-to-md.mjs';

// Publieke URL van de game; komt in de Markdown zodat een AI naar de interactieve versie kan verwijzen.
const SITE_URL = process.env.SITE_URL ?? 'https://testcoders.github.io/interactief-cv/';

// Genereert de AI-leesbare versies uit dezelfde JSON als de game:
//   /llms.txt            index (https://llmstxt.org)
//   /llms-full.txt       alle CV's in één bestand
//   /cv/<id>.md          één CV als Markdown
function aiMarkdown() {
  const files = () => {
    const cvs = readCvs();
    const out = { 'llms.txt': llmsTxt(cvs), 'llms-full.txt': llmsFullTxt(cvs, SITE_URL) };
    for (const cv of cvs) out[`cv/${cv.id}.md`] = cvToMarkdown(cv, SITE_URL);
    return out;
  };

  return {
    name: 'ai-markdown',
    configureServer(server) {
      server.watcher.add(CV_DIR);
      server.middlewares.use((req, res, next) => {
        const path = decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '');
        const body = files()[path];
        if (body === undefined) return next();
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
        res.end(body);
      });
    },
    generateBundle() {
      for (const [fileName, source] of Object.entries(files())) {
        this.emitFile({ type: 'asset', fileName, source });
      }
    }
  };
}

// Relatieve base: werkt op GitHub Pages (/<repo>/), op een eigen domein en lokaal.
export default defineConfig({
  base: './',
  plugins: [aiMarkdown(), localCvShares()],
  build: { chunkSizeWarningLimit: 2000 }
});
