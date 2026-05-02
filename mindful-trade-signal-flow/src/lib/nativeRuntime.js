import { isMobileTransport } from '@/lib/authTransport';

/**
 * Capacitor sets window.Capacitor in native shells (iOS/Android WebView).
 * No @capacitor/core import — keeps web builds safe if dependency differs.
 */
export function isNativeCapacitorShell() {
  if (typeof window === 'undefined') return false;
  try {
    const cap = window.Capacitor;
    return typeof cap?.isNativePlatform === 'function' && cap.isNativePlatform() === true;
  } catch {
    return false;
  }
}

/** Store binaries must use IAP/RevenueCat — not Stripe Checkout / portal */
export function usesNativeStoreBilling() {
  return isMobileTransport() || isNativeCapacitorShell();
}

export function stripeBillingAllowed() {
  return !usesNativeStoreBilling();
}
