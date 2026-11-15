# PS5 Free Live Deal Watch — $0, fail-closed prototype

This project is a **free GitHub Actions + Playwright browser-scanning prototype** for NEW PS5 Slim Disc and Digital consoles. It deliberately refuses to alert when it cannot verify the exact live offer on a retailer-owned purchase surface. It is not yet a proven, reliable, unattended checkout monitor.

## What works today

- Attempts 12 retailer-owned URLs across PlayStation Direct, Best Buy, Target, Walmart, Amazon, GameStop, and Costco once per hour (GitHub schedules may be delayed).
- Uses a real headless Chromium browser, not shopping feeds or search snippets, and saves an audit artifact for each run.
- Detects CAPTCHA blocks, explicitly unavailable shipping, missing prices, and mismatched pages; extracts candidate prices for internal review only.
- Runs 45 hosted safety tests (latest confirmed), including wrong-ZIP, unavailable shipping, ambiguous prices, unverified controller credits, alert deduplication, and restock transitions.
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
