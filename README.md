# PS5 Free Live Deal Watch

A $0 GitHub Actions + Playwright tracker for NEW PS5 Slim consoles, with strict retailer-owned checkout evidence. **The scanner is running, but verified purchase alerts are not operational yet.** No production adapter currently supplies complete Phoenix checkout evidence.

## Current status — November 19, 2026

- Baseline: 302 tests passed. Revision `76f5d7c` passed **315/315 hosted tests** and the offline simulation in [CI run 44559093287](https://github.com/csev21072/ps5-live-deal-watch/actions/runs/44559093287).
- The latest inspected audit (November 19, 12:00 UTC / 5:00 AM Phoenix) attempted 16 product pages across seven retailers. It recorded **zero verified offers** and zero completed cart inspections.
- The seven-day audit contained 18 completed scan entries, 12 labeled scheduled, and a longest scheduled-completion gap of **10.49 hours**. The Actions list returned 11 distinct scheduled run IDs; audit entries are not a count of unique Actions runs.
- Cron is configured hourly at minute 32. **Observed execution has not been reliably hourly.** Successful runs alone do not establish coverage, orderability, notification delivery, or the cause of scheduling gaps.
- Unverified-price notifications were removed after unavailable GameStop leads. Below-target prices appear only in internal research diagnostics.

## Deal rules

| Item | Qualifying threshold |
|---|---:|
| NEW PS5 Slim Disc | $500 |
| NEW PS5 Slim Digital | $450 |
| Additional verified genuine Sony DualSense | Up to $55 bundle credit |

The exact SKU, NEW condition, selected seller and shipper, price, controller count, storage, drive, and currently orderable shipping to Phoenix ZIP 85001 or confirmed local pickup must all agree. Games receive no automatic MSRP credit. Unknown, contradictory, blocked, login-required, or unavailable evidence cannot alert. Generic Add to Cart controls, geolocation, search results, and product-page prices are insufficient.

Fully verified offers can eventually create GitHub Issues assigned to the repository owner. Delivery depends on the owner's GitHub notification settings and is not guaranteed. Persistent state suppresses unchanged offers; verified restock and material price changes can re-alert. Offline tests use fictional offers and a mocked API, never real notifications.

## Workflows

- `.github/workflows/scan.yml`: hourly schedule and manual dispatch, seven-retailer browser scan, guarded publisher, public-safe audit.
- `.github/workflows/health.yml`: safety tests and fictional offline simulation on main-branch pushes or manual dispatch.
- [Actions](https://github.com/csev21072/ps5-live-deal-watch/actions)
- [Latest status audit](https://github.com/csev21072/ps5-live-deal-watch/blob/audit/evidence/latest.json)
- [Seven-day history](https://github.com/csev21072/ps5-live-deal-watch/blob/audit/evidence/history.json)
- [Reliability snapshot](https://github.com/csev21072/ps5-live-deal-watch/blob/audit/evidence/reliability.json)

The reliability snapshot includes `cadence.evaluatedAt`, scheduled-run age, scheduled completions during the preceding 24 hours, and recent gaps. A fresh manual run cannot conceal a stale schedule. New audits record numeric GitHub run IDs and attempt numbers; known reruns are excluded from schedule cadence. Legacy entries without that metadata remain explicitly uncertain and cannot establish a full day of verified hourly cadence. Read the timestamp: a saved report does not refresh itself between runs. `hourly-cadence-observed` describes only the measured past day and does not promise future timing.

## Manual Sony guest-cart research

The scan's **Run workflow** form offers `sony_cart_research`: `none` (default), `disc`, or `digital`. Select an edition to inspect that official Sony console's guest cart even when its observed price exceeds the deal threshold, up to an $800 diagnostic ceiling. This is a research bound, not a budget or authorization to buy.

- Research is accepted only for `workflow_dispatch`; scheduled and push runs cannot enable it.
- Only the selected Sony edition bypasses the normal cart-probe price threshold. Model and independent price-widget checks remain required.
- The entire research run is barred from deal alerts, both in the verdict and the workflow publisher step.
- No checkout button is clicked, address entered, login attempted, payment supplied, or order placed. Cart interaction uses an isolated browser context discarded when the run ends.
- Public evidence retains only status, counts, and booleans about matching cart rows, enabled checkout, and selected Phoenix fulfillment. No raw cart, address, account, cookies, or browser exception text is published.

The first manual research run [44566651736](https://github.com/csev21072/ps5-live-deal-watch/actions/runs/44566651736) completed successfully at 16:33 UTC on November 19; its alert publisher was skipped. It exposed multiple Add to Cart controls, so the old probe stopped before adding a console. A separate live browser inspection then reached the genuine Sony guest cart: Disc SKU `1000049888`, quantity 1, line price $649, with shipping calculated at the next step. The research item was removed and the cart was confirmed empty.

The updated probe scopes the action to the exact product hero, follows the observed `/en-us/checkout?tab=cart` route, and matches the cart item's SKU, title, price and quantity independently of recommendations or totals. Revision `f86dec7` passed 330 hosted tests in [run 44568874500](https://github.com/csev21072/ps5-live-deal-watch/actions/runs/44568874500). The next browser run [44568975820](https://github.com/csev21072/ps5-live-deal-watch/actions/runs/44568975820) completed but could not confirm the slide-out cart. A subsequent correction now inspects the observed cart route even if that panel is missing; it has 331 passing local tests, with hosted validation pending. The cart page alone does not establish Phoenix delivery, selected NEW condition, or selected seller/shipper evidence. A separate read-only inspection of the shipping form with the research item showed generic Standard/Express estimates before any address was entered, plus required name, street address, city, state, ZIP, phone and email fields. No personal data was entered and no payment step was opened. The item was removed again and the empty cart confirmed. Generic shipping estimates are not destination-specific availability.

This removes the need to wait for a sale to investigate Sony's cart structure. It does **not** implement or validate a positive checkout adapter. Missing seller, condition, SKU, or Phoenix fulfillment still needs real observed evidence before any alert path is enabled.

## Development

```sh
npm test
npm run simulate
npm install --no-audit --no-fund
npx playwright install chromium
npm run scan
```

Tests and simulation need no network or dependencies. Browser scans need the pinned Playwright package and Chromium. Do not run the publisher against fictional data with a real GitHub token.

## Next engineering work

1. Run manual Sony cart research and inspect its public artifact plus live retailer UI. Build selectors from observed structure, not guesses. Validate positive and negative evidence for an actual checkout adapter.
2. Investigate scheduling gaps without promising that changing cron alone resolves them. Keep scheduled, manual, and development evidence separate.
3. Repair retailer coverage using current evidence: Best Buy and Walmart were blocked, Costco redirected to its homepage, Target/Amazon had incomplete price or purchase evidence in the inspected audit.
4. Validate a genuine positive checkout, then verify notification creation and delivery. Keep all existing fail-closed tests.

No paid APIs, proxies, TinyFish, subscriptions, logins, purchases, or additional spending. Historical notes remain in `docs/NEXT_STEPS.md`; this current-status page supersedes their older test counts and claims that hosted execution has never been confirmed.
