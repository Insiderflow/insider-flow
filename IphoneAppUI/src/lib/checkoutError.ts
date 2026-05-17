import { ApiError } from "@/api/client";

export function checkoutErrorMessage(
  err: unknown,
  messages: {
    signInRequired: string;
    paymentNotConfigured: string;
    checkoutFailed: string;
  }
): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return messages.signInRequired;
    if (err.message === "payment_config") {
      return messages.paymentNotConfigured;
    }
    if (err.message && err.message !== "unknown_error" && !err.message.startsWith("HTTP")) {
      return err.message;
    }
  }
  return messages.checkoutFailed;
}
