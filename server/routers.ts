import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { getUserByOpenId } from "./db";
import { users, businesses, branches, memberships, businessModules, products, categories, inventoryLevels, stockMovements, orders, orderItems, payments, auditEvents } from "../drizzle/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { canReadOrders, canTransitionOrder } from "./workspacePermissions";
import { z } from "zod";

const industry = z.enum(["restaurant", "cafe", "supermarket", "retail", "pharmacy", "electronics", "other"]);
const roleModules: Record<string, string[]> = {
  restaurant: ["pos", "orders", "kitchen", "inventory", "suppliers", "reports", "staff", "branches"],
  cafe: ["pos", "orders", "kitchen", "inventory", "suppliers", "reports", "staff", "branches"],
  supermarket: ["pos", "orders", "inventory", "suppliers", "reports", "staff", "branches"],
  retail: ["pos", "orders", "inventory", "suppliers", "reports", "staff", "branches"],
  pharmacy: ["pos", "orders", "inventory", "suppliers", "reports", "staff", "branches"],
  electronics: ["pos", "orders", "inventory", "suppliers", "reports", "staff", "branches"],
  other: ["pos", "orders", "inventory", "reports", "staff", "branches"],
};
const ownerRoles = ["owner"];
const inventoryRoles = ["owner", "store_manager"];
const salesRoles = ["owner", "cashier"];

async function tenant(userOpenId: string, businessId: number) {
  const user = await getUserByOpenId(userOpenId);
  if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is unavailable" });
  const [rows] = await db.select({ business: businesses, membership: memberships }).from(memberships)
    .innerJoin(businesses, eq(memberships.businessId, businesses.id))
    .where(and(eq(memberships.userId, user.id), eq(memberships.businessId, businessId), eq(memberships.status, "active"), eq(businesses.status, "active"))).limit(1);
  if (!rows) throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this business." });
  return { db, user, business: rows.business, membership: rows.membership };
}
function allow(role: string, allowed: string[]) {
  if (!allowed.includes(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Your business role cannot perform this action." });
}
const businessInput = z.object({ businessId: z.number().int().positive() });

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  workspace: router({
    myBusinesses: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is unavailable" });
      const user = await getUserByOpenId(ctx.user.openId);
      if (!user) return [];
      return db.select({ business: businesses, membership: memberships }).from(memberships)
        .innerJoin(businesses, eq(memberships.businessId, businesses.id))
        .where(and(eq(memberships.userId, user.id), eq(memberships.status, "active"), eq(businesses.status, "active")));
    }),
    createBusiness: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160), industry, currency: z.string().regex(/^[A-Z]{3}$/).default("KES"), branchName: z.string().trim().min(2).max(160).default("Main branch") })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is unavailable" });
      const user = await getUserByOpenId(ctx.user.openId);
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return db.transaction(async tx => {
        const [businessResult] = await tx.insert(businesses).values({ name: input.name, industry: input.industry, currency: input.currency, createdBy: user.id });
        const businessId = Number(businessResult.insertId);
        await tx.insert(memberships).values({ businessId, userId: user.id, role: "owner", status: "active" });
        await tx.insert(branches).values({ businessId, name: input.branchName, isDefault: true });
        await tx.insert(businessModules).values(roleModules[input.industry].map(moduleKey => ({ businessId, moduleKey, enabled: true })));
        await tx.insert(auditEvents).values({ businessId, actorUserId: user.id, action: "business.created", entityType: "business", entityId: businessId });
        return { businessId, name: input.name, industry: input.industry };
      });
    }),
    summary: protectedProcedure.input(businessInput).query(async ({ ctx, input }) => {
      const { db, membership, business } = await tenant(ctx.user.openId, input.businessId);
      const [branchRows, productRows, orderRows, moduleRows] = await Promise.all([
        db.select().from(branches).where(eq(branches.businessId, business.id)),
        db.select({ count: sql<number>`count(*)` }).from(products).where(and(eq(products.businessId, business.id), eq(products.active, true))),
        db.select({ count: sql<number>`count(*)`, revenue: sql<string>`coalesce(sum(case when ${orders.status} = 'completed' then ${orders.total} else 0 end), 0)`, open: sql<number>`sum(case when ${orders.status} in ('preparing','ready') then 1 else 0 end)` }).from(orders).where(eq(orders.businessId, business.id)),
        db.select().from(businessModules).where(eq(businessModules.businessId, business.id)),
      ]);
      return { business, membership, branches: branchRows, productCount: Number(productRows[0]?.count ?? 0), orderCount: membership.role === "owner" ? Number(orderRows[0]?.count ?? 0) : null, revenue: membership.role === "owner" ? String(orderRows[0]?.revenue ?? "0") : null, openOrders: membership.role === "owner" ? Number(orderRows[0]?.open ?? 0) : null, modules: moduleRows };
    }),
    products: protectedProcedure.input(businessInput.extend({ branchId: z.number().int().positive().optional(), search: z.string().max(100).optional() })).query(async ({ ctx, input }) => {
      const { db, business } = await tenant(ctx.user.openId, input.businessId);
      const rows = await db.select({ product: products, category: categories.name, stock: inventoryLevels.quantity, reorderLevel: inventoryLevels.reorderLevel })
        .from(products).leftJoin(categories, and(eq(categories.id, products.categoryId), eq(categories.businessId, products.businessId)))
        .leftJoin(inventoryLevels, and(eq(inventoryLevels.productId, products.id), eq(inventoryLevels.businessId, products.businessId), input.branchId ? eq(inventoryLevels.branchId, input.branchId) : sql`true`))
        .where(and(eq(products.businessId, business.id), eq(products.active, true), input.search ? sql`(${products.name} like ${`%${input.search}%`} or ${products.sku} like ${`%${input.search}%`} or ${products.barcode} like ${`%${input.search}%`})` : sql`true`))
        .orderBy(products.name).limit(200);
      return rows;
    }),
    createProduct: protectedProcedure.input(businessInput.extend({ branchId: z.number().int().positive(), name: z.string().trim().min(1).max(180), sku: z.string().max(80).optional(), price: z.number().finite().min(0), cost: z.number().finite().min(0).default(0), openingStock: z.number().finite().min(0).default(0), reorderLevel: z.number().finite().min(0).default(0), category: z.string().trim().max(100).optional() })).mutation(async ({ ctx, input }) => {
      const { db, business, membership, user } = await tenant(ctx.user.openId, input.businessId);
      allow(membership.role, inventoryRoles);
      const [branch] = await db.select().from(branches).where(and(eq(branches.businessId, business.id), eq(branches.id, input.branchId))).limit(1);
      if (!branch) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a branch in this business." });
      return db.transaction(async tx => {
        let categoryId: number | null = null;
        if (input.category?.trim()) {
          const [existing] = await tx.select().from(categories).where(and(eq(categories.businessId, business.id), eq(categories.name, input.category.trim()))).limit(1);
          if (existing) categoryId = existing.id;
          else { const [result] = await tx.insert(categories).values({ businessId: business.id, name: input.category.trim() }); categoryId = Number(result.insertId); }
        }
        const [result] = await tx.insert(products).values({ businessId: business.id, categoryId, name: input.name, sku: input.sku || null, price: input.price.toFixed(2), cost: input.cost.toFixed(2) });
        const productId = Number(result.insertId);
        await tx.insert(inventoryLevels).values({ businessId: business.id, branchId: input.branchId, productId, quantity: input.openingStock.toFixed(3), reorderLevel: input.reorderLevel.toFixed(3) });
        if (input.openingStock > 0) await tx.insert(stockMovements).values({ businessId: business.id, branchId: input.branchId, productId, actorUserId: user.id, type: "opening", quantityDelta: input.openingStock.toFixed(3), note: "Opening stock" });
        await tx.insert(auditEvents).values({ businessId: business.id, actorUserId: user.id, action: "product.created", entityType: "product", entityId: productId });
        return { productId };
      });
    }),
    orders: protectedProcedure.input(businessInput.extend({ branchId: z.number().int().positive().optional(), status: z.enum(["pending_payment", "preparing", "ready", "completed", "cancelled"]).optional() })).query(async ({ ctx, input }) => {
      const { db, business, membership } = await tenant(ctx.user.openId, input.businessId);
      if (!canReadOrders(membership.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Your role cannot view sales orders." });
      if (membership.role !== "owner" && !input.branchId) throw new TRPCError({ code: "BAD_REQUEST", message: "Select a branch to view its orders." });
      const status = input.status;
      const filters = [eq(orders.businessId, business.id)];
      if (input.branchId) filters.push(eq(orders.branchId, input.branchId));
      if (membership.role === "kitchen_manager") filters.push(inArray(orders.status, ["preparing", "ready"]));
      if (status) filters.push(eq(orders.status, status));
      const rows = await db.select().from(orders).where(and(...filters)).orderBy(desc(orders.createdAt)).limit(100);
      return rows;
    }),
    checkout: protectedProcedure.input(businessInput.extend({ branchId: z.number().int().positive(), method: z.enum(["cash", "mpesa", "card"]), channel: z.enum(["counter", "table", "takeaway", "delivery"]).default("counter"), items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().finite().positive().max(10000) })).min(1).max(100) })).mutation(async ({ ctx, input }) => {
      const { db, business, membership, user } = await tenant(ctx.user.openId, input.businessId);
      allow(membership.role, salesRoles);
      if (input.method !== "cash") throw new TRPCError({ code: "PRECONDITION_FAILED", message: `${input.method === "mpesa" ? "M-Pesa" : "Card"} payments are unavailable until a payment provider is configured. No sale or stock movement was created.` });
      const [branch] = await db.select().from(branches).where(and(eq(branches.businessId, business.id), eq(branches.id, input.branchId))).limit(1);
      if (!branch) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a branch in this business." });
      const ids = [...new Set(input.items.map(item => item.productId))];
      const productRows = await db.select().from(products).where(and(eq(products.businessId, business.id), inArray(products.id, ids), eq(products.active, true)));
      if (productRows.length !== ids.length) throw new TRPCError({ code: "BAD_REQUEST", message: "One or more products are unavailable." });
      const byId = new Map(productRows.map(item => [item.id, item]));
      const lines = input.items.map(item => { const p = byId.get(item.productId)!; const unit = Number(p.price); return { product: p, quantity: item.quantity, unit, total: Math.round(unit * item.quantity * 100) / 100 }; });
      const subtotal = Math.round(lines.reduce((sum, line) => sum + line.total, 0) * 100) / 100;
      const orderNumber = `TF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      return db.transaction(async tx => {
        for (const line of lines) {
          if (!line.product.trackStock) continue;
          const [stock] = await tx.select().from(inventoryLevels).where(and(eq(inventoryLevels.businessId, business.id), eq(inventoryLevels.branchId, input.branchId), eq(inventoryLevels.productId, line.product.id))).limit(1);
          if (!stock || Number(stock.quantity) < line.quantity) throw new TRPCError({ code: "BAD_REQUEST", message: `Insufficient stock for ${line.product.name}.` });
          const [stockUpdate] = await tx.update(inventoryLevels).set({ quantity: sql`${inventoryLevels.quantity} - ${line.quantity}` }).where(and(eq(inventoryLevels.businessId, business.id), eq(inventoryLevels.branchId, input.branchId), eq(inventoryLevels.productId, line.product.id), sql`${inventoryLevels.quantity} >= ${line.quantity}`));
          if (stockUpdate.affectedRows !== 1) throw new TRPCError({ code: "CONFLICT", message: `Stock changed while completing the sale for ${line.product.name}. Please retry.` });
          await tx.insert(stockMovements).values({ businessId: business.id, branchId: input.branchId, productId: line.product.id, actorUserId: user.id, type: "sale", quantityDelta: (-line.quantity).toFixed(3), note: orderNumber });
        }
        const [result] = await tx.insert(orders).values({ businessId: business.id, branchId: input.branchId, createdBy: user.id, orderNumber, channel: input.channel, status: input.method !== "cash" ? "pending_payment" : ["restaurant", "cafe"].includes(business.industry) ? "preparing" : "completed", subtotal: subtotal.toFixed(2), tax: "0.00", total: subtotal.toFixed(2) });
        const orderId = Number(result.insertId);
        await tx.insert(orderItems).values(lines.map(line => ({ businessId: business.id, orderId, productId: line.product.id, productName: line.product.name, quantity: line.quantity.toFixed(3), unitPrice: line.unit.toFixed(2), lineTotal: line.total.toFixed(2) })));
        await tx.insert(payments).values({ businessId: business.id, orderId, method: input.method, status: input.method === "cash" ? "paid" : "pending", amount: subtotal.toFixed(2) });
        await tx.insert(auditEvents).values({ businessId: business.id, actorUserId: user.id, action: "order.created", entityType: "order", entityId: orderId });
        return { orderId, orderNumber, total: subtotal, currency: business.currency, paymentStatus: input.method === "cash" ? "paid" : "pending" };
      });
    }),
    updateOrderStatus: protectedProcedure.input(businessInput.extend({ orderId: z.number().int().positive(), status: z.enum(["preparing", "ready", "completed", "cancelled"]) })).mutation(async ({ ctx, input }) => {
      const { db, business, membership, user } = await tenant(ctx.user.openId, input.businessId);
      const [row] = await db.select().from(orders).where(and(eq(orders.businessId, business.id), eq(orders.id, input.orderId))).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      if (!canTransitionOrder(membership.role, row.status, input.status)) throw new TRPCError({ code: "FORBIDDEN", message: "That order status transition is not allowed for your role." });
      await db.update(orders).set({ status: input.status }).where(and(eq(orders.businessId, business.id), eq(orders.id, input.orderId)));
      await db.insert(auditEvents).values({ businessId: business.id, actorUserId: user.id, action: `order.${input.status}`, entityType: "order", entityId: input.orderId });
      return { success: true };
    }),
  }),
  platform: router({
    overview: adminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is unavailable" });
      const [businessCount, activeBusinessCount, userCount, orderStats, recentBusinesses, recentAudit] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(businesses),
        db.select({ count: sql<number>`count(*)` }).from(businesses).where(eq(businesses.status, "active")),
        db.select({ count: sql<number>`count(*)` }).from(users),
        db.select({ count: sql<number>`count(*)`, revenue: sql<string>`coalesce(sum(case when ${orders.status} = 'completed' then ${orders.total} else 0 end), 0)` }).from(orders),
        db.select().from(businesses).orderBy(desc(businesses.createdAt)).limit(6),
        db.select({ event: auditEvents, actorName: users.name, actorEmail: users.email }).from(auditEvents).leftJoin(users, eq(auditEvents.actorUserId, users.id)).orderBy(desc(auditEvents.createdAt)).limit(8),
      ]);
      return { stats: { businesses: Number(businessCount[0]?.count ?? 0), activeBusinesses: Number(activeBusinessCount[0]?.count ?? 0), users: Number(userCount[0]?.count ?? 0), grossSales: String(orderStats[0]?.revenue ?? "0"), orders: Number(orderStats[0]?.count ?? 0) }, recentBusinesses, recentAudit };
    }),
    businesses: adminProcedure.input(z.object({ search: z.string().trim().max(100).optional(), status: z.enum(["all", "active", "suspended"]).default("all") })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is unavailable" });
      const filters = [];
      if (input.status !== "all") filters.push(eq(businesses.status, input.status));
      if (input.search) filters.push(sql`(${businesses.name} like ${`%${input.search}%`} or ${businesses.industry} like ${`%${input.search}%`})`);
      const rows = await db.select().from(businesses).where(filters.length ? and(...filters) : undefined).orderBy(desc(businesses.createdAt)).limit(250);
      const memberCounts = await db.select({ businessId: memberships.businessId, count: sql<number>`count(*)` }).from(memberships).groupBy(memberships.businessId);
      const counts = new Map(memberCounts.map(row => [row.businessId, Number(row.count)]));
      return rows.map(business => ({ ...business, memberCount: counts.get(business.id) ?? 0 }));
    }),
    users: adminProcedure.input(z.object({ search: z.string().trim().max(100).optional() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is unavailable" });
      const rows = await db.select().from(users).where(input.search ? sql`(${users.name} like ${`%${input.search}%`} or ${users.email} like ${`%${input.search}%`})` : undefined).orderBy(desc(users.lastSignedIn)).limit(250);
      const memberCounts = await db.select({ userId: memberships.userId, count: sql<number>`count(*)` }).from(memberships).groupBy(memberships.userId);
      const counts = new Map(memberCounts.map(row => [row.userId, Number(row.count)]));
      return rows.map(user => ({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt, lastSignedIn: user.lastSignedIn, membershipCount: counts.get(user.id) ?? 0 }));
    }),
    audit: adminProcedure.input(z.object({ limit: z.number().int().min(1).max(100).default(50) })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is unavailable" });
      return db.select({ event: auditEvents, actorName: users.name, actorEmail: users.email }).from(auditEvents).leftJoin(users, eq(auditEvents.actorUserId, users.id)).orderBy(desc(auditEvents.createdAt)).limit(input.limit);
    }),
    setBusinessStatus: adminProcedure.input(z.object({ businessId: z.number().int().positive(), status: z.enum(["active", "suspended"]) })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is unavailable" });
      const [business] = await db.select().from(businesses).where(eq(businesses.id, input.businessId)).limit(1);
      if (!business) throw new TRPCError({ code: "NOT_FOUND", message: "Business not found" });
      await db.update(businesses).set({ status: input.status }).where(eq(businesses.id, input.businessId));
      const actor = await getUserByOpenId(ctx.user.openId);
      if (actor) await db.insert(auditEvents).values({ businessId: input.businessId, actorUserId: actor.id, action: `business.${input.status}`, entityType: "business", entityId: input.businessId });
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
