/** YYYY-MM-DD in US Eastern (matches mobile BFF). */
export function etCalendarYmd(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}
