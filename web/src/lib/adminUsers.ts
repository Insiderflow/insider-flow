export function isAdminUserEmail(email: string | null | undefined): boolean {
  if (!email) return false;

  const configured = [
    process.env.ADMIN_EMAIL,
    ...(process.env.ADMIN_EMAILS?.split(',') || []),
  ]
    .map((value) => value?.trim().toLowerCase())
    .filter((value): value is string => Boolean(value));

  if (!configured.length) return false;
  return configured.includes(email.trim().toLowerCase());
}
