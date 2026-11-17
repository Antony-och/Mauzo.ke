# TillFlow — Architecture & Implementation Plan

## Product and scope

TillFlow is a configurable, multi-tenant point-of-sale SaaS for food service, grocery, retail, pharmacy, electronics, and other shop operations. It will support platform administration and five business roles: Super Admin, Shop Owner, Cashier, Kitchen Manager, and Store Manager. A business selects its industry at onboarding; industry defaults choose enabled modules and recommended workflows, while business owners can configure available modules. The common platform should provide the core business records and workflows rather than pretending that each industry has a separate application.

## Stack and serving

Use the initialized **React 19 + TypeScript + Tailwind CSS 4 + Wouter** frontend and **Express + tRPC 11 + Drizzle ORM + managed MySQL** backend. The starter is already installed and provisioned with server and managed database; this is a justified alternative to Supabase because it integrates with the managed runtime and provides transactional relational storage for orders, payments, and stock ledgers without adding an unconfigured external service. Continue with existing Radix/shadcn-style UI primitives, lucide icons, TanStack Query via tRPC, and Vitest. Keep all privileged data operations in the server; the browser is not trusted for tenant IDs, prices, totals, permissions, or payment state.

Authentication will preserve the starter's Manus OAuth identity/session flow. The application user is globally identified by the validated OAuth `openId`; platform Super Admin is a global permission, while business roles are memberships scoped to a business (and optionally a branch). Login, business onboarding, and tenant selection must use real authenticated records; no simulated user, environment-based auth bypass, or client-selected role.

## Architecture and project structure

- `client/src/`: responsive React app, route shell, reusable UI, auth/onboarding, role-aware navigation, and dashboard/POS/module pages.
- `client/src/components/`: reusable navigation, data tables, forms, badges, dialogs, empty/loading/error states, and shared dashboard primitives.
- `client/src/pages/`: onboarding, owner overview, products/inventory, suppliers/stock, sales/POS, kitchen queue, reports, branches/staff/settings, and super-admin views.
- `server/routers.ts` and `server/routers/`: typed tRPC routers grouped by identity/onboarding, businesses, products, inventory, orders/payments, staff/branches, reporting, subscriptions, and platform administration.
- `server/_core/`: preserve and extend the existing OAuth/session/context infrastructure; add authentication, active-membership, role-permission, business-scope, validation, and audit helpers.
- `server/services/`: transactional domain services for order placement, inventory movements, payment state transitions, subscription entitlement checks, and payment-provider adapters.
- `server/repositories/` (or focused `server/db` modules): tenant-scoped Drizzle queries. Every tenant-owned read/write receives a server-resolved business context and uses tenant-qualified predicates.
- `drizzle/schema.ts` and `drizzle/`: normalized MySQL schema plus committed additive migrations.
- `shared/`: shared Zod schemas, industry/module definitions, typed permissions, and domain constants safe to share between server and client.
- `public/manus-routes.json`: canonical client page routes for Preview.

## Data and isolation model

The database is project-scoped MySQL, not physically separated per customer. Use a shared-schema tenant model with explicit `businessId` ownership on tenant tables, compound indexes/unique constraints, and composite business-qualified relations where supported. User-provided IDs are never authorization. A server-side resolver loads the authenticated user, verifies business membership and active branch, and returns the trusted tenant context before a protected procedure runs. Every tenant repository method scopes by that context; global operations require a separate Super Admin procedure and permission. Avoid exposing unrestricted generic database procedures. Validate input with Zod, use transactions for checkout/stock/payment transitions, and record auditable actor/time data. The starter's generic `users.role` is not sufficient: retain global user identity and model Super Admin separately from business membership roles.

Initial durable model: `users`; `businesses` (industry, currency, timezone, lifecycle); `business_memberships` (user, business, role, status); `branches`; `business_modules`/settings; `plans`, `subscriptions`, and platform billing records; `categories`, `products` and optional variants/barcodes; `inventory_levels` and immutable `stock_movements`; `suppliers`, purchase orders and deliveries; `orders`, `order_items`, `payments`/payment attempts and receipts; and audit events. Orders and money use server-calculated totals and explicit state machines. Product/order/inventory/payment rows remain business-scoped; branches are validated against the same business. Never model a payment as successful because the browser says so.

## Phased implementation

1. **Architecture and foundation:** establish schema conventions, role/permission map, identity and tenant-context contracts, route manifest, visual system, and precise outcome checklist.
2. **Authentication, onboarding, and isolation:** wire authenticated current-user/business context; support industry selection and first-business/branch creation; create membership-based permissions; ensure zero-tenant and unauthorized states are explicit.
3. **Configurable shell and core records:** role-aware navigation and responsive dashboard shell; persist business/module/branch settings; implement tenant-scoped staff, branches, products, categories, and inventory with stock ledger.
4. **Universal POS and orders:** searchable product catalog, cart, quantities/discount/tax rules, server-priced checkout, order lifecycle, cash/card/M-Pesa payment methods, receipt view/print, and idempotent transactional stock decrement. Build food-service order states and kitchen queue where the food module is enabled.
5. **Store operations and analytics:** supplier/purchase/delivery and stock adjustment workflows; business/branch-scoped sales, inventory, and operational reports derived from database queries rather than hardcoded dashboard data.
6. **Platform operations and hardening:** Super Admin business/plan/feature controls, subscription entitlements and billing records; provider integration boundaries; access-denied/error/loading states, responsive behavior, migrations, and focused tests/build checks.

Each phase retains working paths and is tested incrementally. The final scope depends on external operational prerequisites: production Manus OAuth account access is needed to sign in; live M-Pesa requires a merchant/provider account and protected Daraja credentials; live card processing requires a connected processor/merchant account; and actual subscription collections require billing-provider setup. Cash can work without a third-party processor. Until provider credentials/configuration are supplied, integration surfaces must report an unconfigured state and must not claim a live charge occurred. Do not store credentials in source, client bundles, or database settings. The managed development and production database are shared, so migrations and test writes are treated as durable project data changes.

## Design direction

Three candidate directions (sampled low-probability alternatives):
- **Ledger & Lime — modern retail command surface:** crisp light canvas, ink typography, green accent, compact operational cards. Probability: 0.043.
- **Night Market — dark high-energy POS:** charcoal base, vivid citrus accents, dense neon transaction cues. Probability: 0.071.
- **Warm Counter — hospitality editorial:** cream paper, terracotta details, serif display typography, softer forms. Probability: 0.026.

Chosen direction: **Ledger & Lime**, borrowing the calm precision of contemporary financial operations software while keeping checkout fast and obvious.

- **Design Movement:** contemporary Swiss editorial utility, adapted for a high-throughput retail operations console.
- **Core Principles:** legible at a glance; action-first hierarchy; restrained color with meaningful status signals; consistent interaction patterns across industries.
- **Color Philosophy:** warm near-white and quiet stone create a neutral work surface; deep evergreen signals TillFlow's trusted operating layer; amber/red are reserved for attention and risk, not decoration.
- **Layout Paradigm:** persistent narrow navigation rail, contextual top bar, broad work canvas, and right-side contextual panels for checkout/order detail; POS expands into a focused selling surface rather than a generic admin grid.
- **Signature Elements:** an evergreen transaction rail; compact status pills with clear text and shape; crisp table separators and prominent numeric totals.
- **Interaction Philosophy:** keyboard-friendly, forgiving forms, clear confirmation for irreversible actions, optimistic visual feedback only after server success for financial/stock changes.
- **Animation:** subtle 140–200 ms transitions for drawers and state changes; no distracting motion in the checkout loop; reduced-motion preference honored.
- **Typography System:** Inter for interface/body and tabular numerals for money/counts; restrained weight hierarchy, strong numeric totals, compact but readable labels.
- **Brand Essence:** the dependable operating layer for independent and multi-branch commerce; **clear, capable, adaptable**.
- **Brand Voice:** direct, calm, operational. Example: “Your counter, in sync.” “Stock is low at Riverside — review before the next sale.”
- **Wordmark & Logo:** custom wordmark paired with a compact TillFlow mark made from two offset receipt/flow strokes forming a T; use evergreen as the recognizable signature.
- **Signature Brand Color:** TillFlow Evergreen, a deep balanced green used for primary actions and active navigation.
