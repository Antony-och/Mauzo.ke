import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index, uniqueIndex } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const businesses = mysqlTable("businesses", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  industry: mysqlEnum("industry", ["restaurant", "cafe", "supermarket", "retail", "pharmacy", "electronics", "other"]).notNull(),
  currency: varchar("currency", { length: 3 }).default("KES").notNull(),
  timezone: varchar("timezone", { length: 64 }).default("Africa/Nairobi").notNull(),
  createdBy: int("createdBy").notNull(),
  status: mysqlEnum("status", ["active", "suspended"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ creatorIdx: index("business_creator_idx").on(table.createdBy) }));

export const memberships = mysqlTable("business_memberships", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "cashier", "kitchen_manager", "store_manager"]).default("owner").notNull(),
  status: mysqlEnum("status", ["active", "invited", "disabled"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  businessUserUq: uniqueIndex("membership_business_user_uq").on(table.businessId, table.userId),
  userIdx: index("membership_user_idx").on(table.userId),
  tenantIdx: index("membership_tenant_idx").on(table.businessId, table.id),
}));

export const branches = mysqlTable("branches", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  address: varchar("address", { length: 500 }),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ tenantNameUq: uniqueIndex("branch_tenant_name_uq").on(table.businessId, table.name), tenantIdx: index("branch_tenant_idx").on(table.businessId, table.id) }));

export const businessModules = mysqlTable("business_modules", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  moduleKey: varchar("moduleKey", { length: 64 }).notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ tenantModuleUq: uniqueIndex("module_tenant_key_uq").on(table.businessId, table.moduleKey) }));

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ tenantNameUq: uniqueIndex("category_tenant_name_uq").on(table.businessId, table.name), tenantIdx: index("category_tenant_idx").on(table.businessId, table.id) }));

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  categoryId: int("categoryId"),
  name: varchar("name", { length: 180 }).notNull(),
  sku: varchar("sku", { length: 80 }),
  barcode: varchar("barcode", { length: 80 }),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 12, scale: 2 }).default("0").notNull(),
  trackStock: boolean("trackStock").default(true).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ tenantSkuUq: uniqueIndex("product_tenant_sku_uq").on(table.businessId, table.sku), tenantIdx: index("product_tenant_idx").on(table.businessId, table.id), nameIdx: index("product_tenant_name_idx").on(table.businessId, table.name) }));

export const inventoryLevels = mysqlTable("inventory_levels", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  branchId: int("branchId").notNull(),
  productId: int("productId").notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).default("0").notNull(),
  reorderLevel: decimal("reorderLevel", { precision: 12, scale: 3 }).default("0").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ stockProductUq: uniqueIndex("stock_branch_product_uq").on(table.businessId, table.branchId, table.productId), tenantIdx: index("stock_tenant_branch_idx").on(table.businessId, table.branchId) }));

export const stockMovements = mysqlTable("stock_movements", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  branchId: int("branchId").notNull(),
  productId: int("productId").notNull(),
  actorUserId: int("actorUserId").notNull(),
  type: mysqlEnum("type", ["opening", "sale", "restock", "adjustment", "return"]).notNull(),
  quantityDelta: decimal("quantityDelta", { precision: 12, scale: 3 }).notNull(),
  note: varchar("note", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ tenantIdx: index("movement_tenant_time_idx").on(table.businessId, table.branchId, table.createdAt) }));

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  branchId: int("branchId").notNull(),
  createdBy: int("createdBy").notNull(),
  orderNumber: varchar("orderNumber", { length: 48 }).notNull(),
  channel: mysqlEnum("channel", ["counter", "table", "takeaway", "delivery"]).default("counter").notNull(),
  status: mysqlEnum("status", ["pending_payment", "preparing", "ready", "completed", "cancelled"]).default("pending_payment").notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 12, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ orderUq: uniqueIndex("order_tenant_number_uq").on(table.businessId, table.orderNumber), tenantTimeIdx: index("order_tenant_time_idx").on(table.businessId, table.branchId, table.createdAt), statusIdx: index("order_tenant_status_idx").on(table.businessId, table.status) }));

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 180 }).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
  lineTotal: decimal("lineTotal", { precision: 12, scale: 2 }).notNull(),
}, table => ({ orderIdx: index("order_item_tenant_order_idx").on(table.businessId, table.orderId) }));

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId").notNull(),
  orderId: int("orderId").notNull(),
  method: mysqlEnum("method", ["cash", "mpesa", "card"]).notNull(),
  status: mysqlEnum("status", ["pending", "paid", "failed"]).default("pending").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  reference: varchar("reference", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ tenantOrderIdx: index("payment_tenant_order_idx").on(table.businessId, table.orderId) }));

export const auditEvents = mysqlTable("audit_events", {
  id: int("id").autoincrement().primaryKey(),
  businessId: int("businessId"),
  actorUserId: int("actorUserId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: int("entityId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({ tenantTimeIdx: index("audit_tenant_time_idx").on(table.businessId, table.createdAt) }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
