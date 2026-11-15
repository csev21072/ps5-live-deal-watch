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
