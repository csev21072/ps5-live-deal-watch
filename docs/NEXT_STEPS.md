# Current handoff — November 19, 2026

Read the root README first; the older chronological notes below are retained as history, not current instructions or validation claims.

Recovered remote main: `a79add79508b3a69966641dffd2309335a36033c`. Its 302 local tests pass. The current revision has 315 passing local tests and a passing offline simulation; hosted results must be inspected before claiming hosted acceptance.

Current changes: explicit manual-only Sony guest-cart research at above-target prices (maximum $800, no purchase), research-run notification exclusion, public cart observation counts/booleans, and clock-based cadence reporting that exposes stale scheduled execution even after a manual run. No positive checkout adapter has been enabled. Price targets remain Disc $500 / Digital $450.

Live UI inspection on November 19 found the GameStop Flowering Chaos Digital page displaying NEW and disabled Not Available, Ship to Home, same-day delivery, and pickup controls. No cart was added and no notification was sent. This is a rejection observation, not a verified Phoenix restock baseline.

Latest inspected hosted audit: November 19 12:00 UTC, 16 pages/7 retailers, no verified offer or cart inspection. Audit history has 12 schedule-labeled entries but the API lists 11 distinct scheduled run IDs; do not equate them. Longest completed scheduled gap: 10.49 hours. All listed runs succeeded; the cause of the missing hourly cadence is unresolved.

Next: dispatch Sony research, inspect its actual guest-cart evidence, implement the narrowly observed retailer adapter with positive and negative tests, and continue investigating schedule gaps. The existing ChatGPT watch is separate; do not create duplicate watches or change unrelated automations. Never convert price-only candidates into deal alerts.

---

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

## Hosted Sony price verification milestone (2026-11-15 22:47 UTC)

- Repaired the scanner's missing Sony price/cart imports and public URL sanitizer wiring. A new scanner-wiring regression suite now checks those imports and the independent verification gate.
- The hosted run `43771096368` completed successfully, including scan, alert-history restore, no-alert publisher, artifact, and audit push.
- The audit at `2026-11-15T22:47:55Z` contains 14 product URLs across all seven retailers, zero verified qualifying offers. The Sony Disc 1TB and Digital 825GB pages now yield matching retailer-owned price widget and adjacent dollar context; both are above their respective qualifying thresholds, so the Sony cart probe correctly reports `price-above-target`.
- A public audit URL sanitizer now removes query strings, fragments, embedded credentials and unexpected hosts from published URLs.
- The Sony price parser was strengthened to distinguish separated cents (e.g., `$ 649 00` versus `$ 649 99`) so an integer widget cannot silently round a different displayed price.
- The verified-offer GitHub issue publisher requests assignment to the repository owner for free notification delivery, subject to GitHub settings; no unverified deal issues were created.
- Hosted CI after these changes: **160/160 tests passed**. The browser workflow is again hourly/manual-only. No metered tools or payments were used.

### Remaining material blocker
A real positive purchase verification has **not** been demonstrated. The system must still prove matching NEW condition, SKU, seller, current price and Phoenix-specific orderable cart/checkout for at least one genuinely qualifying offer before sending alerts. Do not enable alerts from price-widget evidence alone.

## November 15 — verified coverage accounting and seven-day history

- Added `src/coverage.mjs` and regression tests. The scan now records each retailer's attempted pages, blocked/unreadable pages, observed product headings, guest-cart research, and fully verified orderable offers. An attempted page or green workflow never counts as complete retailer verification. Overlapping blocked/unreadable statuses are correctly deduplicated.
- Added `src/audit-history.mjs` and updated `scripts/save-audit.sh` to persist a bounded seven-day hourly history in `audit:evidence/history.json`. It stores only timestamps and coarse coverage counts, not prices, personal data, cart contents or notifications. It tracks gaps between actual completed scans, without inferring their cause.
- GitHub-hosted scan `43772362259` **completed successfully** with the new history pipeline. The first history entry was saved at `2026-11-15T23:02:01Z`: 14 pages attempted across seven retailers, eight readable product pages, three blocked, two unreadable, and zero fully verified orderable offers. These categories can overlap; they are not additive.
- Added an exact approved retailer-domain allowlist to the purchase gate. Spoofed hosts, cross-retailer mismatches and unknown sellers cannot qualify by supplying self-declared host fields.
- Discovery pages now distinguish CAPTCHA-blocked, no readable links, and inspected pages; a loaded search page is not automatically a successful discovery.
- Strengthened Sony guest-cart safety: it requires matching independently observed Sony price-widget evidence before any cart interaction. GameStop cart research now requires an independently identified matching Disc/Digital edition.
- GitHub-hosted CI at commit `9b2cc2b`: **186/186 tests passed** with no failures. Temporary push-triggered browser scans have been removed; hourly/manual-only operation remains configured.
- **Remaining blocker:** No positive, independently verified retailer-owned checkout with exact NEW SKU, seller, price and Phoenix orderability has been observed. Do not alert from price-only or research-only evidence.

### Next steps
1. Inspect subsequent hourly history entries to distinguish genuinely missed/delayed scheduled runs from unreadable retailers. Do not send no-deal notifications.
2. Validate a real retailer-specific positive checkout path on a qualifying offer without purchasing, logging in with payment details, or bypassing anti-bot protections.
3. Test the verified-offer GitHub Issue notification and dedup against a real positive checkout event, never a fabricated live deal.
4. Continue with zero paid services and conservative bundle math.

## November 15 — Offline end-to-end alert validation (no real notifications)

- Extracted the pure GitHub verified-deal Issue formatter into `src/alerts/issue.mjs`; production `src/publish.mjs` uses it after re-evaluating the live evidence.
- Added `test/fixtures/fictional-offer.mjs` and `scripts/simulate-offers.mjs` for an explicitly fictional, **zero-network** scenario sequence: first verified offer, unchanged duplicate, wrong Phoenix ZIP, seller mismatch, CAPTCHA, SKU/ZIP-specific sold out, verified restock, material price drop, unchanged lower price.
- Added `test/helpers/mock-github.mjs` and `test/publisher-mock.test.mjs`: the real publisher subprocess runs with **every** GitHub API request intercepted. It validates one owner-assigned Issue, suppression of an already existing event key, no requests for an unverified offer, no state advancement on API 500, and one fallback retry without assignee on API 422. These are tests only: no actual GitHub Issue, retailer request, or purchase.
- Hosted CI run `43774164078` passed **203/203 tests** and executed the fictional simulation separately, confirming `githubApiCalls: 0`, `retailerRequests: 0`, `purchases: 0`.
- Hardened the production checkout gate further: a cart must corroborate the exact PS5 SKU in its selected item text, selected NEW condition, seller, fulfillment method, and enabled checkout control. Updated fictional and regression fixtures and added negative tests. This work still needs its own latest hosted CI confirmation.
- **Still missing:** a real retailer-specific adapter that can supply all these fields from a genuinely orderable Phoenix checkout. The offline test proves code paths and fail-closed behavior, not real-world orderability. Do not send simulated deal alerts.

## November 15 — Actual cart DOM observation groundwork

- Added `src/checkout/cart-controls.mjs`: a read-only Playwright DOM observation of retailer cart item rows, selected shipping/pickup options and checkout button. The pure assessor requires exactly one matching product row, an explicit selected Phoenix ZIP 85001 fulfillment option, an enabled checkout control, and NEW rather than pre-owned/refurbished text. **It always returns `verifiedPurchase:false`** pending retailer-specific live validation.
- Integrated these bounded research observations into both the PlayStation Direct and GameStop guest-cart probes, without clicking checkout, signing in, submitting an address or purchasing.
- Added nine negative/positive research tests covering SKU mismatch, multiple rows, wrong ZIP, unselected shipping, disabled checkout, pre-owned units, unreadable DOM and no false positive.
- Hardened `src/rules.mjs` so the final deal gate requires matching selected cart SKU/item text, NEW condition, seller, fulfillment method and enabled checkout control in addition to the existing product, price, seller, Phoenix and freshness evidence. This is still not sufficient to claim a real positive until a live adapter can produce the evidence.
- Hosted safety CI run `43774396398`: **217/217 tests passed**. A one-time free hosted browser smoke scan was triggered to check that the new cart probes do not break unattended scans; check its outcome before claiming completion and remove the temporary push trigger.
- The fictional end-to-end publisher test remains zero-network: it does not open real GitHub Issues or place orders.

## Hosted end-to-end checkpoint — 2026-11-15 23:24 UTC

- Real GitHub-hosted scanner run `43774418197` completed **successfully** after the read-only cart DOM changes: Chromium installation, live scan, alert-history restore, verified-only publisher, artifact upload and audit/history push all passed.
- Latest audit timestamp `2026-11-15T23:23:52Z`: 14 product URLs attempted across all seven retailers, eight readable product pages, three blocked, two unreadable (categories overlap), zero independently verified orderable offers. Sony product-page prices were above target; GameStop product pages did not offer an orderable guest cart. No deal notification was generated.
- The bounded seven-day audit history now has two entries. This establishes successful **runs**, not full retailer inventory verification or guaranteed hourly timing.
- Hosted safety CI run `43774591192`: **218/218 tests passed**, including the real publisher with intercepted GitHub API, offline fictional scenario simulation, read-only cart DOM observations, and a regression guard against importing fictional fixtures into the production scanner.
- The temporary push trigger was removed; the live scan remains hourly plus manual, and all added infrastructure uses free public GitHub Actions.
- **Remaining external validation:** a genuinely qualifying NEW PS5 with real retailer-owned cart/checkout evidence for Phoenix ZIP 85001. No current adapter may assert that complete proof; do not turn research-only cart signals into a verified deal.

## November 15 — exact cart evidence, five-retailer diagnostics, and Target price research

- Fixed a genuine cart-parser syntax regression found by hosted CI. Rebuilt `src/evidence/cart.mjs` from a clean source and added explicit SKU, price and ZIP boundary checks in `src/checkout/evidence-checks.mjs`. Positive checkout evidence must now match the exact SKU token, the console's own item-row price (not a cart subtotal), and a selected shipping/pickup label with exact Phoenix ZIP 85001.
- Removed raw cart item and shipping excerpts from public audit objects. Read-only cart diagnostics now emit bounded booleans rather than potential account names, emails or addresses. New tests reject SKU substring collisions, ZIP collisions, wrong cents, subtotal confusion and PII leakage.
- Added `src/checkout/origin.mjs` to refuse redirects to a different retailer host, login or challenge page before price extraction or any guest-cart action.
- Added `src/probes/product-controls.mjs` for read-only purchase controls on Best Buy, Target, Walmart, Amazon and Costco. A subsequent live audit revealed that Target's Pickup/Delivery/Shipping buttons had initially been counted as actionable cart controls; fixed this by separating **actual Add to Cart/Buy Now actions** from mere fulfillment navigation. These diagnostics never assert orderability.
- Added `src/probes/target-price.mjs` to read only exact-heading Target product JSON-LD USD price hints. Structured metadata is research only and is never substituted for a live checkout price or used to issue an alert.
- Latest independently confirmed hosted CI run `43775838801`: **258/258 tests passed**, zero failures.
- A one-time free hosted browser smoke run was requested for Target price hints and corrected cart-action status. Confirm the scan/audit outcome before declaring success; remove the temporary push trigger afterward.
- **Remaining blocker:** No real retailer-owned positive checkout has yet established exact NEW console SKU, item price, seller, and selected orderable Phoenix fulfillment. Do not notify from metadata, generic buttons, or cart research alone.

## Hosted verification checkpoint — 2026-11-15 23:40 UTC

- Live browser run `43775856326` completed **successfully**: scanner, durable state restore, verified-only publisher, artifact upload, and seven-day audit/history push all passed.
- Audit `2026-11-15T23:39:49Z`: 14 product URLs across all seven retailers, **zero fully verified orderable offers**. History now has four entries.
- Corrected Target diagnostics: both Target console bundle pages expose **Pickup/Delivery/Shipping navigation**, not an actual Add to Cart control. The previous generic probe overcounted these as actionable. Both now correctly report `fulfillment-controls-only` with zero cart actions.
- Target JSON-LD exact-heading USD price research found **no reliable product price hint** on either page; it did not modify the offer price or generate an alert.
- Best Buy remains unreadable/blocked in hosted Chromium; Walmart and Costco product identification is incomplete; discovered Amazon offers are either too expensive or lack a verified cart action. Sony pages are above target; GameStop guest carts remain not orderable.
- Hosted CI run `43775981395` passed **261/261 tests**, including checkout SKU/ZIP/price boundary tests, privacy redaction, redirect safety, Target metadata isolation, and generic purchase-control diagnostics.
- The temporary browser push trigger was removed; GitHub Actions remains hourly/manual only, with zero paid services.
- **Next engineering work:** pursue legitimate retailer-specific live checkout evidence when a truly orderable qualifying offer appears. No fabricated checkout evidence or unverified notifications.

## November 15 — public audit privacy, reliability, and negative stock correction

- Replaced public `audit:evidence/latest.json` with a strict status-only projection via `src/public-audit.mjs`. Raw product page snippets, cart rows, shipping addresses, account identifiers, browser exceptions, seller text and arbitrary status strings are omitted. Price and per-retailer status counts remain visible. Existing older Git commits are not rewritten; this protection applies to newly published audits.
- Changed the GitHub Actions downloadable artifact to contain only `out/public-evidence.json` and `out/summary.md`, never raw `out/evidence.json` or alert-state files. The publisher still uses its in-run evidence, but the public artifact and branch receive only the sanitized projection.
- Added `src/reliability.mjs` and `audit:evidence/reliability.json` to track actual completed scan counts, observed gaps, seven-retailer attempt coverage and verified offers. A gap is observational, not proof GitHub skipped a scheduled job.
- Corrected GameStop negative stock diagnostics: both global "Not Available" labels are now `all-fulfillment-unavailable-unscoped`, not proof that the exact NEW SKU was unavailable in Phoenix. No false restock baseline can be created.
- Suppressed raw Playwright exception strings from public Actions logs; unreadable product scans use a fixed status.
- One-time hosted browser run `43776994660` completed **successfully**, including scan, verified-only publisher, public-safe artifact generation, and publishing the redacted audit plus reliability report. Audit `2026-11-15T23:52:21Z` attempted 14 product pages across all seven retailers; eight readable product pages, three blocked and two unreadable (categories overlap); zero verified orderable offers.
- New `audit:evidence/history.json` has five observed entries; `audit:evidence/reliability.json` reports zero observed gaps over 1.5 hours among these development runs. This is **not** yet proof of unattended hourly scheduling.
- Latest independently confirmed hosted CI run `43777137891`: **277/277 tests passed**; subsequent minor log-redaction tests need their own final CI confirmation.
- The temporary push-triggered browser scan has been removed; hourly/manual-only remains configured. No paid or metered services used.
- **Remaining actual blocker:** a genuinely qualifying NEW PS5 with independently verified retailer-owned checkout and selected orderable Phoenix ZIP 85001 fulfillment. Current probes remain research-only and cannot emit a verified purchase alert. Do not loosen this gate or manufacture a positive result.

## November 15 follow-on — checkout negatives, diagnostic candidates, and schedule provenance

- Hardened `selectedFulfillmentMatches` to reject additional explicit shipping/pickup denials, including "not eligible", "not supported", "not orderable", "unable to ship", and "restricted" for Phoenix ZIP 85001.
- Added `src/checkout/seller.mjs`: the live purchase gate now requires positive retailer-owned "Sold by" / "Seller:" and "Shipped by" / "Ships from" labels, rather than trusting an arbitrary substring that could appear in a negation or unrelated merchant description.
- Added `src/candidates.mjs`: a **diagnostic-only**, non-alerting price research queue in public `audit:evidence/latest.json`. It distinguishes prices below the base Disc $500 / Digital $450 targets from actual orderability, including explicit "attractive-price-but-not-orderable" statuses. It never claims stock from a displayed price.
- Hardened the public GitHub verified-deal Issue formatter to remove raw cart/shipping text, full addresses, arbitrary seller labels and retailer URL query/session parameters. It preserves Phoenix ZIP and verified seller/model/price details. The first edit introduced a syntax error and the repair initially changed the expected "Phoenix 85001" wording; both regressions were caught by hosted tests and corrected.
- Added scan trigger provenance (`schedule`, `workflow_dispatch`, `push`, `local`) to the scan evidence and seven-day history. Reliability reporting now separates **actual scheduled scans** from development push and manual runs. Previous entries without trigger metadata remain unknown rather than being counted as proof of hourly scheduling.
- Hosted CI run `43780906754`: **298/298 tests passed**. The earlier failed intermediate commits were repaired; do not infer any successful live checkout from unit tests.
- A one-time hosted browser smoke scan for these changes is the next verification step. Restore hourly/manual-only triggers after starting it.

## Verified hosted milestone — 2026-11-16 00:34 UTC

- GitHub Actions browser run `43780965869` completed successfully, including Chromium scan, verified-only Issue publisher, sanitized audit artifact, and durable history/reliability publication.
- New audit `2026-11-16T00:33:52Z` includes `triggerType: push`, 14 product pages across all seven retailers, and zero independently verified orderable offers. The status-only candidate research queue identifies GameStop Digital bundle $374.99 and GameStop Disc bundle $449.99 as **attractive-price-but-not-orderable**. Neither has a usable guest cart; neither is a verified deal or notification.
- Reliability report now correctly distinguishes actual scheduled runs from development runs. Six historical scans are observed, but **zero have verified `triggerType: schedule`** so far (earlier entries lack provenance). Do not claim proven unattended hourly execution from these development runs. Wait for the next genuine GitHub cron event.
- Verified Issue formatting no longer publishes raw checkout text, shipping addresses, email addresses or tracking/session query parameters. The first implementation had a syntax error and then a three-test failure caused by wording; both were fixed. Final hosted CI run `43781129277`: **300/300 tests passed**, 0 failed.
- Scanner now isolates browser page creation/closure errors per retailer so a single page failure need not abort the entire scan. Public audits reject unapproved retailer host pairs.
- Temporary development push trigger is removed. Hourly cron at minute 32 and manual dispatch remain configured; zero paid services.
- **Still blocked:** a positive real retailer-owned checkout showing exact NEW SKU, seller, item price, and selected orderable Phoenix ZIP 85001 fulfillment. Do not enable price-only notifications or claim the two GameStop prices are purchasable.

