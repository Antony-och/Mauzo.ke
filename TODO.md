# Mauzo delivery outcomes

- [ ] **Architecture, durable data, authentication, and strict tenant isolation:** The final product is a production-ready universal SaaS POS platform, not just a collection of dashboard designs. Build from scratch in logical phases, starting with project architecture, database design, authentication, and multi-tenancy before implementing dashboards and POS functionality. Include secure authentication and role-based permissions. Use a multi-tenant database architecture with strict business data isolation. Use real database integrations, functional features, proper security, and reusable components; avoid mock functionality and hardcoded dashboard data.
- [ ] **Industry onboarding and configurable modules:** Support restaurants, cafés, supermarkets, retail shops, pharmacies, electronics stores, and other businesses. During onboarding, businesses select their industry, and the platform automatically adapts its dashboard, POS, inventory, modules, and workflows. Make the system configurable with business modules and settings.
- [ ] **Five role-based profiles and authorization:** Implement Super Admin, who manages the entire SaaS platform, businesses, subscriptions, billing, features, and global settings; Shop Owner, who manages their business, dashboard, products, inventory, staff, branches, reports, POS, and settings; Cashier, who processes sales, manages orders, accepts payments, and handles receipts; Kitchen Manager, who monitors incoming orders, manages food preparation, and updates order statuses; and Store Manager, who manages inventory, suppliers, stock movements, and deliveries.
- [ ] **Products, inventory, supplier, and branch operations:** Implement product and inventory management, branch management, suppliers, stock movements, and deliveries with data scoped to the owning business and branch.
- [ ] **Universal point of sale and order management:** Provide a universal POS and order management workflow suitable for supported business types. Support M-Pesa, cash, and card payment methods, and cashier receipts. Financial and stock changes must be server-authorized and persisted.
- [ ] **Restaurant kitchen workflow:** Where food-service modules are enabled, kitchen staff must monitor incoming orders, manage food preparation, and update order statuses.
- [ ] **Reports and analytics:** Provide reports and analytics based on persisted business/branch data, with appropriate access control.
- [ ] **SaaS platform administration and billing:** Super Admin manages businesses, subscriptions, billing, features, and global settings. Implement subscription plans and billing with truthful provider configuration/status.
- [ ] **Responsive professional interface:** Provide responsive, professional dashboards with reusable components for the supported business workflows.
- [ ] **Stack and integration fit:** Use React, TypeScript, Tailwind CSS, shadcn/ui, and Supabase unless a better stack is justified. The approved plan justifies the initialized React/TypeScript/Tailwind + Express/tRPC + Drizzle/MySQL managed stack as the integrated alternative. Use the real managed database; connect functional front- and back-end behavior.


## Brand update

The site is called **Mauzo**, uses **#E67E22**, and uses the supplied horizontal logo. The public SaaS homepage is `/`; the authenticated product workspace is `/app`.
