import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const deck = resolve(import.meta.dirname, '..');
const repo = resolve(deck, '../..');
const result = spawnSync('npm', ['run', 'build', '--', '--configLoader', 'runner', '--outDir', resolve(deck, 'public/demo'), '--emptyOutDir'], {
  cwd: repo,
  stdio: 'inherit',
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
await mkdir(resolve(deck, 'public/design'), { recursive: true });
await cp(resolve(repo, 'design/retro-pixel-art'), resolve(deck, 'public/design/retro-pixel-art'), { recursive: true });
console.log('Game, Markdown en alle retrodesigns staan lokaal klaar.');
