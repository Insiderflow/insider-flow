/** Must match insider-flow/web/src/lib/mobile/tradeFlags.ts */
export type TradeFlagCode =
  | "notable_size"
  | "committee_sector"
  | "congress_cluster";

export function tradeHasFlags(
  flags: TradeFlagCode[] | undefined,
): flags is TradeFlagCode[] {
  return Boolean(flags && flags.length > 0);
}
