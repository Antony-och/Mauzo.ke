export type BusinessRole = "owner" | "cashier" | "kitchen_manager" | "store_manager";
export type OrderState = "pending_payment" | "preparing" | "ready" | "completed" | "cancelled";

export function canReadOrders(role: BusinessRole) {
  return role === "owner" || role === "cashier" || role === "kitchen_manager";
}

export function canTransitionOrder(role: BusinessRole, current: OrderState, next: OrderState) {
  if (role === "owner") return (current === "preparing" && next === "ready") || (current === "ready" && next === "completed");
  if (role === "kitchen_manager") return current === "preparing" && next === "ready";
  if (role === "cashier") return current === "ready" && next === "completed";
  return false;
}
