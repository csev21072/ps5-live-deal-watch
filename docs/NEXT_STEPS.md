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

## Additional free discovery and evidence — same session

- Added `src/discovery.mjs` and eight new tests. It visits each retailer's own public search page to discover up to two additional explicitly Disc/Digital PS5 console/bundle URLs per retailer. Search-page content is **discovery only**; it is never price or stock evidence. It rejects third-party domains, ambiguous editions, PS5 Pro, refurbished, duplicate URLs and tracking parameters.
- Integrated newly discovered product URLs into the browser scanner while keeping all previously known static product URLs. Discovery coverage is included in the audit.
- Added bounded GameStop shipping/pickup quote capture for audit diagnostics; quotes are not checkout confirmation.
- The latest independently verified hosted CI after these changes passed **54/54** tests.
- A one-time hosted browser smoke scan was triggered for the discovery integration. Inspect the `audit` branch and remove the temporary push trigger when it finishes.

## Verified hosted smoke checkpoint (2026-11-15 22:02 UTC)

- GitHub Actions browser run `43766815287` completed **successfully**, including browser installation, full scan, state restore, publisher, artifact, and audit push.
- 7 retailer-owned search pages attempted; 14 product URLs scanned (12 static, 2 newly discovered Amazon URLs). Readability and checkout completeness vary; no candidate passed every checkout requirement.
- `audit:evidence/latest.json` records the 14 attempts and discovery metadata; `audit:evidence/alert-state.json` contains 14 durable non-alerting state entries.
- Independent hosted safety suite: **66/66 passed**. Added `node --check` to both workflows after fixing a publisher syntax bug, and subprocess integration tests to catch broken publish behavior.
- Removed temporary push-triggered browser scans after the successful smoke run. The scanner is now **hourly + manual** only; the lightweight safety suite remains push-triggered.
- No real verified positive checkout path exists yet. **Next engineering priority remains a retailer-specific cart/checkout adapter**, not loosening any rule.

## Latest engineering follow-up (2026-11-15 22:04 UTC)

- Strengthened `src/rules.mjs`: a verified alert now requires a separate retailer-owned cart/checkout URL, matching exact SKU, price, Phoenix ZIP 85001, orderability text, and fresh timestamp. A product page plus Add to Cart is never enough.
- Added publisher subprocess integration tests: no-alert state writing, invalid-history fail-closed, and no GitHub credential/no notification behavior.
- Extended the GameStop probe to inspect the guest cart only when a cart action is observed, capturing bounded research evidence. It **always** marks `verifiedPurchase:false` until a separately validated full checkout adapter exists.
- Independent hosted safety suite: **67/67 passed**. GitHub Actions browser workflow remains hourly/manual-only. ChatGPT hourly task also remains enabled with a strict zero-spend override.

## November 15 follow-on: evidence quality, Phoenix pickup and bundle priority

- Added bounded visible product evidence collection in `src/evidence/product.mjs` and the scanner. This records product headings, selected-price text, SKU/storage/extra-controller **hints**, and relevant purchase controls without ever asserting seller, condition, or Phoenix checkout verification. Main-content filtering reduces navigation noise.
- Added `src/evidence/cart.mjs` to match a GameStop cart item to the exact product URL SKU and product heading, distinguish item price from unrelated cart items/subtotals, check shipping-context ZIP, and reject CAPTCHA/wrong-host evidence. **It never sets verifiedCheckout=true**.
- Added `src/probes/gamestop-pickup.mjs` for free Phoenix ZIP 85001 store-finder research when GameStop shipping is unavailable or the cart is disabled. Store listings are NOT a confirmed orderable reservation and always have `verifiedPickup:false`.
- Strengthened the purchase gate: explicitly reject PS5 Pro/unverified Slim, conflicting seller/shipper text, and unapproved Amazon/Walmart marketplace sellers. Two-controller credits require evidence of a genuine extra Sony DualSense; game credits require recent actual sale-price evidence and are capped at $40.
- Strengthened restock state: even a retailer-owned unavailability indication is not a verified restock baseline without exact SKU and Phoenix context. CAPTCHA or pickup-unknown never triggers a restock re-alert.
- Free discovery now prioritizes likely two-controller bundle URLs before limiting each retailer to two newly discovered products, while never treating titles as verified contents.
- Latest hosted CI after these changes: **106/106 passed**, 0 failed (run `43768335633`). The hourly GitHub Actions scanner remains enabled; the temporary push trigger was removed.
- The last inspected hosted browser audit completed successfully and attempted 14 product URLs across all seven retailers. No complete positive checkout verification was observed. **No verified purchase alert has been issued.**

### Next development focus
Use future hourly audits to identify a genuinely orderable product whose retailer-owned cart shows exact SKU, price, NEW condition, seller, and Phoenix ZIP-specific shipping or reservable pickup. Then implement a narrow retailer-specific positive adapter and validate it with real evidence and adversarial regression fixtures. Never synthesize positive checkout evidence from search, product titles, generic Add to Cart, store lists, or a browser's geolocation.

## Nov 15 — New condition inspection, official Sony pages, and CI race fix

- Investigated actual hosted GameStop audit: both tested listings displayed a price but no actionable Add to Cart control, no confirmed selected NEW condition, and Phoenix store-finder interaction was blocked. This is **not** evidence of a purchasable offer. Rather than alert, the scanner now captures disabled/selected condition controls and attempts only an unambiguous exact NEW option, verifying the selection afterward before any cart interaction.
- Fixed CI health audit branch race: GitHub-hosted tests passed but one older run failed while pushing `ci-health` because concurrent writers updated the same ref. Added serialized CI writer concurrency to prevent this failure.
- Replaced PlayStation Direct's two duplicate category URLs with the official individual console purchase pages:
  - `https://direct.playstation.com/en-us/buy-consoles/playstation5-console-1-tb`
  - `https://direct.playstation.com/en-us/buy-consoles/playstation5-digital-edition-console-825-gb`
  These are product URLs, **not verified current prices or stock**.
- Changed official Sony discovery to its console catalog, expanded `buy-consoles` product-path support, and excluded PS5-compatible accessories/faceplates from URL discovery after a prior scan picked up an accessory as a false candidate.
- Added `src/probes/playstation-direct.mjs` and tests to inspect manufacturer-owned console model, storage, drive, and included-controller hints without asserting NEW condition, price, or Phoenix checkout. This is research-only until independent retailer-owned checkout is validated.
- Added bundle-credit safety tests: only one additional genuine DualSense may receive the $55 credit automatically; implausible multi-controller counts fail closed.
- Triggered a one-time free hosted smoke scan for the new Sony product URLs; inspect the next `audit:evidence/latest.json` and remove the temporary push trigger after completion.

## November 15 continued — retailer-specific verification research

- The GameStop hosted audit showed two product pages with no actionable Add to Cart control, no verified selected NEW option, and blocked Phoenix store-finder interactions. The scanner now records selected/disabled controls and can select an unambiguous NEW radio option only when it can re-confirm selection; it never selects pre-owned or purchases.
- Hosted GitHub CI was serialized to prevent competing `ci-health` branch pushes. One earlier CI run had 107 passing tests but failed on an audit ref-lock conflict, which is distinct from a test failure.
- PlayStation Direct now uses exact official Disc 1TB and Digital 825GB product pages, not the shared catalog. The first hosted smoke scan confirmed the correct Sony model, drive type, storage, Slim model-group hint, and one DualSense in the box. However, the price widget emitted a bare integer (`649` / `599`) and the global page contained unrelated accessory unavailability text; neither was sufficient for an alert.
- Added a Sony-specific price widget parser that requires an exact retailer-owned price selector and adjacent visible dollar currency context before normalizing an integer price. Mismatched cents, unknown selectors, and accessory-sized amounts fail closed.
- Sony global accessory unavailability no longer proves console stock is unavailable. A separate Sony guest-cart research probe is now integrated but only runs for sufficiently identified models with a current displayed price at/below the target; it never purchases or marks checkout verified.
- A scanner syntax error caused by string replacement expansion was found in the first Sony price-context implementation, repaired from the last good source, and prevented from passing hosted syntax checks. Hosted CI on repaired commit `ef3ce51`: **149/149 tests passed**.
- One further hosted browser scan was triggered to validate the repaired price-context capture. Do not claim the scan succeeded until its Actions job and `audit` branch are checked. Remove the temporary push trigger after the smoke test and leave hourly/manual only.

## November 15 — Sony widget and scanner wiring hardening

- A hosted scan of the exact Sony console pages confirmed that the product-price widget's visible text is an integer (`649` / `599`), while the dollar symbol may be in an adjacent element. Added `src/evidence/sony-price.mjs`: it normalizes a price only when a recognized official widget selector and matching visible dollar context agree, and rejects mismatched cents/ambiguous amounts.
- The Sony product page's unrelated Vertical Stand accessory was labeled `Currently Unavailable`. This was incorrectly treated as console unavailability. The scanner now treats Sony's global accessory stock text as unscoped, not as proof the selected console is sold out.
- A first price-context scanner edit had a syntax error caused by JavaScript string replacement expansion. After restoring from a good commit, the next hosted scan exposed missing imports (`parseSonyPriceEvidence`, `publicRetailerUrl`, and `probeSonyCart`) from that restore. Those imports and the Sony cart call are now restored; `test/scan-wiring.test.mjs` guards against recurrence.
- Public audit URLs are now sanitized to remove session-bearing query strings and fragments before being stored on the public `audit` branch. Added five URL-sanitization tests.
- The verified-offer GitHub issue publisher now requests assignment to the repository owner so the owner may receive free GitHub notifications, subject to GitHub settings. It retries without assignment only on a definite HTTP 422 validation rejection.
- Latest hosted CI checkpoint on commit `6968017`: **157/157 passed**, 0 failures. A new one-time hosted browser run was triggered for the repaired scanner; confirm its outcome and return the workflow to hourly/manual-only.
- **Still no verified positive checkout adapter or orderable deal alert.** Do not report one based on Sony product facts, a price widget, an Add to Cart button, or a cart research probe alone.
