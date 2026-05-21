import type { Locale, Messages } from "../types";
import ko from "./ko";
import zhHant from "./zh-Hant";
import zhHans from "./zh-Hans";

export const messages: Record<Locale, Messages> = {
  "zh-Hant": zhHant,
  "zh-Hans": zhHans,
  ko,
};

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}
