import { defineConfig } from 'vite';

// Relatieve base: werkt op GitHub Pages (/<repo>/), op een eigen domein en lokaal.
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 2000 }
});
