#!/usr/bin/env bash
# Publish only non-sensitive scanner diagnostics to a separate branch.
# This never creates a deal notification or touches the main branch.
set -euo pipefail

if [[ ! -s out/evidence.json ]]; then
  echo "No evidence.json was generated; skipping audit update."
  exit 0
fi
cp out/evidence.json "${RUNNER_TEMP:-/tmp}/ps5-evidence.json"
if [[ -s out/alert-state.json ]]; then
  cp out/alert-state.json "${RUNNER_TEMP:-/tmp}/ps5-alert-state.json"
fi
if [[ -s out/summary.md ]]; then
  cp out/summary.md "${RUNNER_TEMP:-/tmp}/ps5-summary.md"
fi
git fetch --no-tags origin audit
# Generate a small, non-alerting seven-day history before switching off main.
if git cat-file -e origin/audit:evidence/history.json 2>/dev/null; then
  git show origin/audit:evidence/history.json > "${RUNNER_TEMP:-/tmp}/ps5-previous-history.json"
else
  printf '[]\n' > "${RUNNER_TEMP:-/tmp}/ps5-previous-history.json"
fi
node src/audit-history.mjs "${RUNNER_TEMP:-/tmp}/ps5-previous-history.json" "${RUNNER_TEMP:-/tmp}/ps5-evidence.json" "${RUNNER_TEMP:-/tmp}/ps5-history.json"
node src/public-audit.mjs "${RUNNER_TEMP:-/tmp}/ps5-evidence.json" "${RUNNER_TEMP:-/tmp}/ps5-public-evidence.json"
node src/reliability.mjs "${RUNNER_TEMP:-/tmp}/ps5-history.json" "${RUNNER_TEMP:-/tmp}/ps5-reliability.json"
git switch -C audit origin/audit
mkdir -p evidence
cp "${RUNNER_TEMP:-/tmp}/ps5-public-evidence.json" evidence/latest.json
cp "${RUNNER_TEMP:-/tmp}/ps5-history.json" evidence/history.json
cp "${RUNNER_TEMP:-/tmp}/ps5-reliability.json" evidence/reliability.json
if [[ -s "${RUNNER_TEMP:-/tmp}/ps5-alert-state.json" ]]; then
  cp "${RUNNER_TEMP:-/tmp}/ps5-alert-state.json" evidence/alert-state.json
fi
if [[ -s "${RUNNER_TEMP:-/tmp}/ps5-summary.md" ]]; then
  cp "${RUNNER_TEMP:-/tmp}/ps5-summary.md" evidence/latest.md
fi
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add evidence/latest.json evidence/latest.md evidence/alert-state.json evidence/history.json evidence/reliability.json
if git diff --cached --quiet; then
  echo "Audit evidence unchanged."
  exit 0
fi
git commit -m "audit: latest non-alerting retailer scan [skip ci]"
git push origin audit
