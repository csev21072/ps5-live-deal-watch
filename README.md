# PS5 Free Live Deal Watch — $0, fail-closed prototype

This project is a **free GitHub Actions + Playwright browser-scanning prototype** for NEW PS5 Slim Disc and Digital consoles. It deliberately refuses to alert when it cannot verify the exact live offer on a retailer-owned purchase surface. It is not yet a proven, reliable, unattended checkout monitor.

## What works today

- Attempts 12 retailer-owned URLs across PlayStation Direct, Best Buy, Target, Walmart, Amazon, GameStop, and Costco once per hour (GitHub schedules may be delayed).
- Uses a real headless Chromium browser, not shopping feeds or search snippets, and saves an audit artifact for each run.
- Detects some inaccessible/unavailable pages and extracts candidate prices for internal review only.
- Applies strict NEW, seller, price, model, bundle, Phoenix ZIP 85001, and orderability rules. Extra genuine standard DualSense controllers are valued at $55 each; games default to $0 unless defensible sale-value evidence is supplied.
- **Does not currently issue alerts from these scans** because the retailer-specific checkout + Phoenix fulfillment adapters have not been implemented and validated. That is intentional: it prevents false positives.

## Why there may be no alerts

Retailers frequently show prices when shipping is unavailable, show stock for a different ZIP code, or block automated browsers. This project never treats an Add to Cart button, 'In Stock', a generic shipping policy, or a search result as proof. All unknown fields fail closed. In particular, the current browser scanner **does not** set retailer-specific ZIP codes or proceed through carts/checkout. Its extracted candidate price alone can never pass the verification gate.

## Free setup

1. Use a **public** GitHub repository named `ps5-live-deal-watch`.
2. Under repository Settings → Actions → General, allow GitHub Actions if needed. The workflow uses only `GITHUB_TOKEN`; no paid credentials, retailer logins, or API keys are needed.
3. Under Actions, select **PS5 hourly live retailer scan** → **Run workflow** to test it. Review the workflow summary and `ps5-scan-evidence` artifact. A green workflow check means the scan executed, **not** that all seven retailers were verified.
4. For future verified alerts, GitHub Issues can be used for notifications; watch the repository and enable GitHub email/mobile notifications. No Issues will be created until a real checkout adapter proves every condition.

## Future work required before real automatic alerts

Implement and independently test a retailer-specific adapter for each supported retailer. Each adapter must verify: exact SKU/bundle, NEW condition, current price, seller and shipper, controllers/storage/drive, Phoenix shipping or truly orderable Phoenix pickup, and a current cart or checkout purchase state without placing an order. It must capture exact retailer-owned text and a timestamp, and reject blocked or conflicting evidence. Only then may an adapter supply `fulfillment.confirmed=true` and `cartOrCheckoutConfirmed=true`. Add regression fixtures and independent tests for sold-out, wrong ZIP, marketplace, login, and cart-state conflicts before enabling Issues.

## Cost and security

Public GitHub-hosted standard Actions runners are normally free, subject to GitHub's current policies, availability, abuse limits, and scheduling behavior. The project does not buy anything, request payment information, use paid services, or require private retailer credentials. The public repository will expose only monitoring code, public product URLs, and ZIP 85001. Do not commit personal addresses, passwords, cookies, or payment information. This is a discovery and evidence-audit prototype, **not** a guarantee of catching fast-moving Black Friday deals.
