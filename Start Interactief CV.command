#!/bin/bash
set -e

cd -- "$(dirname -- "$0")"
if ! command -v npm >/dev/null; then
  printf 'Installeer eerst Node.js met npm en start dit bestand opnieuw.\n' >&2
  exit 1
fi

if [[ ! -x node_modules/.bin/vite ]]; then
  npm ci
fi

exec npm run dev -- --host 127.0.0.1 --open
