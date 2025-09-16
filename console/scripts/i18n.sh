#!/usr/bin/env bash

set -euo pipefail

[[ -n "${DEBUGME+x}" ]] && set -x

npx i18next -c config/i18next-parser.config.mjs
npx ts-node scripts/i18n/set-english-defaults.ts

if git status --short --untracked-files -- locales; then
  echo "Localization files are not up to date. Run 'npm run i18n' then commit changes."
  git --no-pager diff locales
  exit 1
fi
