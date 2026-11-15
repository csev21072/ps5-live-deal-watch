# PS5 Free Live Deal Watch — $0, fail-closed prototype

This project is a **free GitHub Actions + Playwright browser-scanning prototype** for NEW PS5 Slim Disc and Digital consoles. It deliberately refuses to alert when it cannot verify the exact live offer on a retailer-owned purchase surface. It is not yet a proven, reliable, unattended checkout monitor.

## What works today

- Attempts 12 known retailer-owned URLs plus up to two newly discovered product URLs per retailer across PlayStation Direct, Best Buy, Target, Walmart, Amazon, GameStop, and Costco once per hour (GitHub schedules may be delayed).
- Uses a real headless Chromium browser, not shopping feeds or search snippets, and saves an audit artifact for each run.
- Detects CAPTCHA blocks, explicitly unavailable shipping, missing prices, and mismatched pages; extracts candidate prices for internal review only.
- Runs 160 hosted safety tests (latest confirmed), including wrong-ZIP, unavailable shipping, ambiguous prices, unverified controller credits, alert deduplication, and restock transitions.
- Performs a bounded GameStop guest-cart research probe for potentially qualifying listings; **the probe does not generate alerts or assert checkout verification**.
- Writes the latest non-alerting scanner audit to the separate `audit` branch when GitHub Actions runs successfully; the `ci-health` branch records a passing test-run witness. These branch files may be absent until hosted workflows complete.
- Stores durable alert history in `audit:evidence/alert-state.json` and suppresses unchanged offers, small price fluctuations, and false restock signals from CAPTCHAs or unconfirmed pickup. The publisher is wired but **no scanner path currently produces verified checkout evidence**, so no issues/alerts should be generated.
- Applies strict NEW, seller, price, model, bundle, Phoenix ZIP 85001, and orderability rules. Extra genuine standard DualSense controllers are valued at $55 each; games default to $0 unless defensible sale-value evidence is supplied.
- **Does not currently issue alerts from these scans** because the retailer-specific checkout + Phoenix fulfillment adapters have not been implemented and validated. That is intentional: it prevents false positives.

## Why there may be no alerts

Retailers frequently show prices when shipping is unavailable, show stock for a different ZIP code, or block automated browsers. This project never treats an Add to Cart button, 'In Stock', a generic shipping policy, or a search result as proof. All unknown fields fail closed. In particular, the current browser scanner **does not** set retailer-specific ZIP codes or proceed through carts/checkout. Its extracted candidate price alone can never pass the verification gate.

## Free setup

1. Use a **public** GitHub repository named `ps5-live-deal-watch`.
2. Under repository Settings → Actions → General, allow GitHub Actions if needed. The workflow uses only `GITHUB_TOKEN`; no paid credentials, retailer logins, or API keys are needed.
3. Under Actions, select **PS5 hourly live retailer scan** → **Run workflow** to test it. Review the workflow summary and `ps5-scan-evidence` artifact. After a successful run, inspect `audit/evidence/latest.json` on the `audit` branch. The separate **PS5 free CI safety tests** workflow can publish `ci-health/evidence/ci-health.json` to prove tests ran on a GitHub runner. A green workflow check means the scan executed, **not** that all seven retailers were verified.
4. For future verified alerts, GitHub Issues can be used for notifications; watch the repository and enable GitHub email/mobile notifications. No Issues will be created until a real checkout adapter proves every condition.

## Future work required before real automatic alerts

Implement and independently test a retailer-specific adapter for each supported retailer. Each adapter must verify: exact SKU/bundle, NEW condition, current price, seller and shipper, controllers/storage/drive, Phoenix shipping or truly orderable Phoenix pickup, and a current cart or checkout purchase state without placing an order. It must capture exact retailer-owned text and a timestamp, and reject blocked or conflicting evidence. Only then may an adapter supply `fulfillment.confirmed=true` and `cartOrCheckoutConfirmed=true`. Add regression fixtures and independent tests for sold-out, wrong ZIP, marketplace, login, and cart-state conflicts before enabling Issues.

## Cost and security

Public GitHub-hosted standard Actions runners are normally free, subject to GitHub's current policies, availability, abuse limits, and scheduling behavior. The project does not buy anything, request payment information, use paid services, or require private retailer credentials. The public repository will expose only monitoring code, public product URLs, and ZIP 85001. Do not commit personal addresses, passwords, cookies, or payment information. This is a discovery and evidence-audit prototype, **not** a guarantee of catching fast-moving Black Friday deals.

## Development status and next verification gate

The initial free scanner and test suite are committed, but **GitHub-hosted workflow execution has not yet been confirmed** until an actual Actions run completes and its audit witness appears. The GameStop probe may observe a cart interaction but is deliberately incapable of asserting full Phoenix fulfillment. Next: inspect real hosted scan evidence, fix blocked selectors, and implement a complete retailer-owned checkout evidence path for a genuinely orderable offer. No search-result, screenshot-only, or incomplete-cart observation may become a notification.

## Alert history rules

An initial fully verified orderable offer can create a GitHub Issue. An unchanged verified offer does not. A price change must be at least $5 from the last alerted price; a seller or material condition change can alert regardless of price. A restock may alert only after product-specific retailer-owned evidence confirms **all relevant fulfillment options unavailable**, not merely shipping unavailable while pickup is unknown. CAPTCHA, failed page loads, and missing prices preserve the previous state without creating alerts. A missing audit state file causes the scan to fail closed rather than reset history. The implementation is testable but **has not yet generated any real verified checkout alert**.

## Free new-product discovery

The scanner visits retailer-owned search pages to **discover URLs only**. Candidate titles must explicitly identify a PS5 console/bundle and its Disc or Digital edition. Host allowlists, product-path checks, duplicate suppression, and exclusion of used/refurbished/PS5 Pro reduce noise. Search-page prices, seller claims, stock indicators, and snippets are **never purchase evidence**. The browser must visit the actual retailer-owned product page and pass the independent checkout gate. Blocked search pages do not prevent attempts at the 12 static URLs. Discovery coverage and candidates are saved in the private-in-the-workflow/public-in-the-audit `audit/evidence/latest.json` file, containing only public product metadata and generic Phoenix ZIP 85001.

## Hosted smoke-test observations

The first hosted discovery run reached all seven retailer search attempts and discovered two additional Amazon product URLs. It scanned 14 product URLs in total, but the notification step failed due to a JavaScript syntax error in the publisher. That error was fixed, and both CI and scan workflows now run `node --check` on key JavaScript files before executing. The latest hosted CI checkpoint passed **62/62 tests**, including the new independent cart-evidence requirements. A follow-up full browser scan is needed to verify the repaired publisher and persistent state flow. A green safety test alone does not prove live checkout availability.

### Latest validated hosted checkpoint

The follow-up GitHub-hosted Chromium smoke test completed successfully on November 15, 2026. It attempted seven retailer-owned discovery searches and 14 product pages (12 static plus two newly discovered Amazon URLs), restored the durable alert state, ran the notification gate without creating unverified alerts, and saved the audit. The audit now has 14 state entries. A successful hosted scan **does not** establish that all retailer pages were readable or that a purchasable deal exists. The workflow has been returned to hourly/manual triggers only. The latest independent CI checkpoint passed 160/160 tests, including a real subprocess test of the publisher's no-alert and invalid-history behavior.

**Checkout evidence gate:** Even a retailer-owned product page with an Add to Cart button cannot alert. The current rules require independent matching SKU, current price, Phoenix ZIP 85001 fulfillment, an orderable state, and a fresh retailer-owned cart/checkout URL. GameStop's guest-cart probe currently captures bounded research evidence only; it never asserts a verified purchase. No complete positive checkout adapter has yet been validated.

### Current safety improvements

- New bounded retailer product evidence, SKU-scoped cart matching, and Phoenix ZIP store-finder research help diagnose why an offer is or isn't orderable. They are **diagnostic-only** until a complete independently verified retailer checkout is observed.
- New-product discovery prioritizes likely two-controller bundles, but a search title never proves contents or stock.
- PS5 Pro, unverified Slim editions, conflicting seller/shipper evidence, and unapproved Amazon/Walmart marketplace offers cannot trigger alerts.
- Extra genuine Sony DualSense value is capped at $55 per additional verified controller. Included-game value is capped at $40 and requires recent contemporaneous sale-price evidence; MSRP alone never counts.
- Restock re-alerts require exact product/SKU and Phoenix-specific proof that the offer had actually become unavailable, not merely a generic out-of-stock label.
- Latest hosted safety suite: **106/106 passing**. No verified positive checkout adapter exists yet, so the tracker will remain silent rather than invent a purchasable deal.

### Official Sony console page improvements

PlayStation Direct is now monitored through its exact individual Disc 1TB and Digital 825GB console product URLs, rather than two copies of the general catalog. A read-only Sony product probe confirms model/storage/disc/one-controller hints from the manufacturer-owned page, and a separate strict price-widget parser requires adjacent currency context. Accessory stock messages are not treated as console stock evidence. A bounded guest-cart probe can research a qualifying-price offer without login, payment or purchase; it still cannot assert verified Phoenix fulfillment. No positive checkout verification has been observed. The latest confirmed hosted CI checkpoint passed **160/160 tests**.

### Verified-offer notification delivery

When and only when an offer passes every retailer-owned checkout verification gate, the publisher opens a GitHub Issue and requests assignment to the repository owner. GitHub may then send its normal web/email/mobile issue notification according to the owner's GitHub notification preferences. If GitHub rejects assignment with HTTP 422, the issue is created without an assignee instead. This does **not** guarantee a push/email notification; enabling repository Issues notifications or watching the repository is still recommended. No notification issues are created for blocked, sold-out, price-only, or unverified offers.

### November 15 hosted verification result

The repaired zero-spend hosted browser scan completed successfully and saved an audit covering 14 product URLs across all seven retailers. On the two official Sony console pages, the browser observed the manufacturer's exact selected product-price widgets and adjacent dollar context. Both current selected prices were above the user's qualifying thresholds, so the cart research probe correctly skipped checkout and **no alert was generated**. Sony accessory stock labels are no longer misreported as console availability. The public audit URL sanitizer strips query strings and fragments. CI now guards scanner wiring and tests separated cents to prevent incorrect dollar amounts. Latest hosted safety tests: **160/160 passed**.

### Coverage quality and unattended reliability

The scanner now writes an internal per-retailer coverage breakdown into `audit/evidence/latest.json`. It distinguishes pages attempted, unreadable or CAPTCHA-blocked, product pages observed, cart research, and fully verified orderable offers. A successful GitHub Actions job is **not** proof of full retailer coverage. A bounded seven-day `audit/evidence/history.json` tracks hourly scan timestamps, coverage counts and gaps once the hosted history-writing workflow completes successfully; these records do not contain prices, personal information, or deal notifications. The deal gate also rejects spoofed or mismatched retailer hostnames. Latest hosted safety suite: **182/182 tests passed**. The history-writing integration still requires confirmation from the hosted browser smoke run.

### Offline end-to-end notification validation (November 15)

Run `npm run simulate` to exercise **fictional** qualifying checkout, wrong ZIP, unverified seller, CAPTCHA, duplicate, verified restock, and price-drop scenarios entirely offline. This command does not access retailers or GitHub, open issues, or make purchases. The production Issue formatter is shared with the real publisher; an independent subprocess test runs the actual publisher with **all** GitHub API requests intercepted by a test-only mock. It tests owner assignment, duplicate suppression, API failures without state advancement, and assignee-validation fallback. The hosted safety workflow runs this dry-run automatically with no GitHub token. The latest confirmed hosted checkpoint passed **208/208 tests**.

The live checkout gate now also requires an exact selected cart-item SKU, selected NEW condition, matching seller, selected Phoenix fulfillment method, and enabled checkout control in addition to the existing price, storage, drive, and ZIP evidence. These requirements are validated against fictional fixtures; no production retailer adapter has yet demonstrated all of them on a real orderable offer. **No fake deal notifications are generated.**

### Read-only cart DOM research

The Sony and GameStop guest-cart probes now attempt to inspect **the actual selected cart item, shipping/pickup radio selection, and checkout-button enabled state** when a potentially qualifying offer can be added to the cart. They do not click checkout, enter addresses, log in, pay, or mark an offer verified. A matching product row without exact NEW, selected Phoenix ZIP 85001 fulfillment, and a uniquely enabled checkout control is classified as incomplete. Even when those controls appear, the result is explicitly `research-fields-observed-needs-live-review`, never a verified deal. The latest hosted safety suite passed **217/217 tests**.
