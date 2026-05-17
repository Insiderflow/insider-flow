import { ApiError } from '@/api/client';
import { appAbsoluteUrl } from '@/lib/appBase';

/** Same error codes as production ManageSubscriptionButton + portal route */
export function portalErrorMessage(
  err: unknown,
  messages: {
    noSubscription: string;
    invalidCustomer: string;
    paymentConfig: string;
    portalFailed: string;
    signInRequired: string;
    generic: string;
  }
): string {
  if (err instanceof ApiError) {
    const code = err.message;
    if (code === 'no_subscription') return messages.noSubscription;
    if (code === 'invalid_customer') return messages.invalidCustomer;
    if (code === 'payment_config') return messages.paymentConfig;
    if (code === 'portal_failed') return messages.portalFailed;
    if (err.status === 401) return messages.signInRequired;
    return messages.generic;
  }
  return messages.generic;
}

export function subscriptionReturnUrl(path = '/settings/subscription') {
  return appAbsoluteUrl(path);
}
