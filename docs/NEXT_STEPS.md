# PS5 $0 tracker — engineering handoff (2026-11-15)

## Objective
Monitor NEW PS5 Slim Disc <= $500 and Digital <= $450, or conservative bundles. Additional genuine standard DualSense credit <= $55; do not assume games' MSRP. All seven retailers must be attempted hourly. **Never alert unless exact live retailer-owned price, NEW condition, seller, SKU, controllers/storage/drive, and orderable Phoenix ZIP 85001 shipping or confirmed Phoenix pickup are observed.** No paid or metered tools, TinyFish, subscriptions, retailer logins, or payments.

## Published now
- Main repo: `csev21072/ps5-live-deal-watch`, public.
- Hourly and push-triggered Playwright scan: `.github/workflows/scan.yml`.
- Independent zero-dependency safety-test workflow: `.github/workflows/health.yml`.
- Browser scanner: `src/scan.mjs`, URLs: `src/config.mjs`.
- Price/purchase verification gates: `src/rules.mjs`.
- Explicit CAPTCHA, unavailable, missing-price diagnostics: `src/diagnostics.mjs`.
- GameStop bounded guest-cart research probe: `src/probes/gamestop.mjs`.
- 29 local Node tests passed (original 13 + 7 diagnostics + 5 additional safety + 4 GameStop).
- Audit script: `scripts/save-audit.sh` commits public non-alerting latest scan to `audit:evidence/latest.json` and `audit:evidence/latest.md`.
- Independent health workflow commits test witness to `ci-health:evidence/ci-health.json`.

## Critical status
- **Not yet a working fully verified deal-alert system.** `src/scan.mjs` never sets `fulfillment.confirmed=true` or `cartOrCheckoutConfirmed=true`, so no candidate may qualify. This is deliberate until a retailer checkout adapter is tested with real evidence.
- GitHub-hosted workflow completion has **not** been independently confirmed at handoff. Inspect `ci-health/evidence/ci-health.json` and `audit/evidence/latest.json` after a run. Missing witness is not proof of a failed scan: check Actions run logs, repo Actions permissions, and whether workflow execution was enabled.
- Existing ChatGPT hourly PS5 tracker is enabled and has a strict zero-spend override. Keep it; do not send user-facing no-deal recaps.
- Known prior browser observations: Target/Walmart CAPTCHA; Amazon 'See price in cart' plus CAPTCHA on cart; GameStop known unavailable offers correctly rejected. Do not treat those old observations as live current prices or inventory.

## Next development tasks, in order
1. Verify a real GitHub-hosted CI safety run. If no witness appears, inspect the Actions UI/logs and resolve workflow execution before claiming hosted reliability.
2. Verify a real hourly browser scan. Read audit branch to classify each retailer as blocked, unavailable, price unreadable, mismatched, or candidate needing checkout. Fix broken URLs/selectors using live evidence, not guesses.
3. Build and independently test at least one retailer-specific Phoenix checkout adapter. Start with GameStop or PlayStation Direct. A positive adapter must capture exact product and selected NEW offer, price, seller/shipper, controller count, storage, drive, Phoenix shipping or local pickup, and actual cart/checkout orderability. Never purchase. Explicitly reject CAPTCHA, sold-out, location mismatch, and inconsistent price. Only enable alerts after positive **and** negative integration fixtures pass.
4. Implement persistent state for deduplication and restock re-alerts before enabling notification issues. Avoid sending unchanged alerts.
5. Expand to remaining retailers, with strict coverage accounting. Do not promise CAPTCHA bypass or full retailer coverage.
6. Keep everything at $0. GitHub public standard runners are free under GitHub policy; no paid services or top-ups.

## Constraints
Do not remove fail-closed gates to force alerts. Do not equate 'Add to Cart' or 'In Stock' with confirmed fulfillment. No price from search snippets, shopping feeds, cached pages, or third-party deal sites is alert evidence. User values accuracy over speed and does not want unavailable or unverified listings mentioned as deals.

## November 15 follow-on — durable alert safety

- Added `src/alerts/state.mjs` and `test/alert-state.test.mjs`. These pure functions distinguish first verified offer, unchanged offer, >=$5 cumulative price movement, seller/terms change, and restock after **explicitly confirmed** unavailability. CAPTCHA and unknown scans cannot establish a restock.
- Added durable `audit:evidence/alert-state.json`, restored before each scan's publish step. Missing or invalid state fails closed; it must not be silently recreated after initialization.
- Reworked `src/publish.mjs` to emit GitHub issues only for independently qualifying offers, suppress repeats with persistent state and stable event keys, and write state only after successful notifications.
- Updated `scripts/save-audit.sh` to save the alert state together with scan evidence on the `audit` branch. If publishing fails, the prior state remains.
- Hardened GameStop probe: unavailable same-day delivery is **not** proof standard ship-to-home is unavailable; unavailable shipping with unknown pickup is not proof complete unavailability. No real positive purchase checkout has yet been verified.
- Hosted CI passed 44/44 tests after initial state changes; an additional shipping regression was added afterward and must be checked in CI.
- A one-time push-triggered hosted browser smoke run was requested to validate the full state restore/publish/audit flow. Remove the temporary push trigger once its outcome is known; retain hourly and manual triggers only.

### Remaining gates
1. Confirm one full hosted browser scan after state integration and inspect `audit/evidence/alert-state.json` for durable non-alerting state. Resolve workflow failures if any.
2. Do not enable any positive alert path until a retailer-specific purchase adapter proves exact current Phoenix fulfillment and NEW model, SKU, seller, storage, controller count, price, and checkout orderability on a genuine current offer.
3. Add tests for the checkout adapter with negative and positive evidence, and dedup integration.
4. Keep strict $0 spend.
