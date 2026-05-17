import type { AuthUser } from "@/context/AuthContext";

const PAID_STATUSES = new Set(["active", "trialing", "grace_period"]);

export function isPaidUser(user: AuthUser | null | undefined): boolean {
  if (!user) return false;

  const status = (user.subscription_status || "").toLowerCase();
  if (PAID_STATUSES.has(status)) {
    if (user.membership_expires_at) {
      return new Date(user.membership_expires_at) > new Date();
    }
    return true;
  }

  const tier = (user.membership_tier || "").toLowerCase();
  if (tier === "paid" || tier === "pro" || tier === "premium") {
    if (user.membership_expires_at) {
      return new Date(user.membership_expires_at) > new Date();
    }
    return true;
  }

  return false;
}

export function membershipLabel(user: AuthUser | null | undefined): "premium" | "free" {
  return isPaidUser(user) ? "premium" : "free";
}
