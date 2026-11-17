CREATE TABLE `audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int,
	`actorUserId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`address` varchar(500),
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `branches_id` PRIMARY KEY(`id`),
	CONSTRAINT `branch_tenant_name_uq` UNIQUE(`businessId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `business_modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`moduleKey` varchar(64) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_modules_id` PRIMARY KEY(`id`),
	CONSTRAINT `module_tenant_key_uq` UNIQUE(`businessId`,`moduleKey`)
);
--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`industry` enum('restaurant','cafe','supermarket','retail','pharmacy','electronics','other') NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'KES',
	`timezone` varchar(64) NOT NULL DEFAULT 'Africa/Nairobi',
	`createdBy` int NOT NULL,
	`status` enum('active','suspended') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `category_tenant_name_uq` UNIQUE(`businessId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `inventory_levels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`branchId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` decimal(12,3) NOT NULL DEFAULT '0',
	`reorderLevel` decimal(12,3) NOT NULL DEFAULT '0',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_levels_id` PRIMARY KEY(`id`),
	CONSTRAINT `stock_branch_product_uq` UNIQUE(`businessId`,`branchId`,`productId`)
);
--> statement-breakpoint
CREATE TABLE `business_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','cashier','kitchen_manager','store_manager') NOT NULL DEFAULT 'owner',
	`status` enum('active','invited','disabled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `business_memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `membership_business_user_uq` UNIQUE(`businessId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`productName` varchar(180) NOT NULL,
	`quantity` decimal(12,3) NOT NULL,
	`unitPrice` decimal(12,2) NOT NULL,
	`lineTotal` decimal(12,2) NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`branchId` int NOT NULL,
	`createdBy` int NOT NULL,
	`orderNumber` varchar(48) NOT NULL,
	`channel` enum('counter','table','takeaway','delivery') NOT NULL DEFAULT 'counter',
	`status` enum('pending_payment','preparing','ready','completed','cancelled') NOT NULL DEFAULT 'pending_payment',
	`subtotal` decimal(12,2) NOT NULL,
	`tax` decimal(12,2) NOT NULL DEFAULT '0',
	`total` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `order_tenant_number_uq` UNIQUE(`businessId`,`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`orderId` int NOT NULL,
	`method` enum('cash','mpesa','card') NOT NULL,
	`status` enum('pending','paid','failed') NOT NULL DEFAULT 'pending',
	`amount` decimal(12,2) NOT NULL,
	`reference` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`categoryId` int,
	`name` varchar(180) NOT NULL,
	`sku` varchar(80),
	`barcode` varchar(80),
	`price` decimal(12,2) NOT NULL,
	`cost` decimal(12,2) NOT NULL DEFAULT '0',
	`trackStock` boolean NOT NULL DEFAULT true,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_tenant_sku_uq` UNIQUE(`businessId`,`sku`)
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`branchId` int NOT NULL,
	`productId` int NOT NULL,
	`actorUserId` int NOT NULL,
	`type` enum('opening','sale','restock','adjustment','return') NOT NULL,
	`quantityDelta` decimal(12,3) NOT NULL,
	`note` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stock_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `audit_tenant_time_idx` ON `audit_events` (`businessId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `branch_tenant_idx` ON `branches` (`businessId`,`id`);--> statement-breakpoint
CREATE INDEX `business_creator_idx` ON `businesses` (`createdBy`);--> statement-breakpoint
CREATE INDEX `category_tenant_idx` ON `categories` (`businessId`,`id`);--> statement-breakpoint
CREATE INDEX `stock_tenant_branch_idx` ON `inventory_levels` (`businessId`,`branchId`);--> statement-breakpoint
CREATE INDEX `membership_user_idx` ON `business_memberships` (`userId`);--> statement-breakpoint
CREATE INDEX `membership_tenant_idx` ON `business_memberships` (`businessId`,`id`);--> statement-breakpoint
CREATE INDEX `order_item_tenant_order_idx` ON `order_items` (`businessId`,`orderId`);--> statement-breakpoint
CREATE INDEX `order_tenant_time_idx` ON `orders` (`businessId`,`branchId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `order_tenant_status_idx` ON `orders` (`businessId`,`status`);--> statement-breakpoint
CREATE INDEX `payment_tenant_order_idx` ON `payments` (`businessId`,`orderId`);--> statement-breakpoint
CREATE INDEX `product_tenant_idx` ON `products` (`businessId`,`id`);--> statement-breakpoint
CREATE INDEX `product_tenant_name_idx` ON `products` (`businessId`,`name`);--> statement-breakpoint
CREATE INDEX `movement_tenant_time_idx` ON `stock_movements` (`businessId`,`branchId`,`createdAt`);