import { describe, expect, it } from "vitest";
import { canReadOrders, canTransitionOrder } from "./workspacePermissions";

describe("business order permissions", () => {
  it("limits order visibility to owner, cashier, and kitchen staff", () => {
    expect(canReadOrders("owner")).toBe(true);
    expect(canReadOrders("cashier")).toBe(true);
    expect(canReadOrders("kitchen_manager")).toBe(true);
    expect(canReadOrders("store_manager")).toBe(false);
  });
  it("enforces kitchen and checkout order-state transitions by role", () => {
    expect(canTransitionOrder("kitchen_manager", "preparing", "ready")).toBe(true);
    expect(canTransitionOrder("kitchen_manager", "ready", "completed")).toBe(false);
    expect(canTransitionOrder("cashier", "ready", "completed")).toBe(true);
    expect(canTransitionOrder("cashier", "preparing", "completed")).toBe(false);
    expect(canTransitionOrder("store_manager", "preparing", "ready")).toBe(false);
    expect(canTransitionOrder("owner", "ready", "completed")).toBe(true);
  });
});
