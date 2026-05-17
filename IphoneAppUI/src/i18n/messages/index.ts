import type { Locale, Messages } from "../types";
import zhHant from "./zh-Hant";
import zhHans from "./zh-Hans";

export const messages: Record<Locale, Messages> = {
  "zh-Hant": zhHant,
  "zh-Hans": zhHans,
};

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}
