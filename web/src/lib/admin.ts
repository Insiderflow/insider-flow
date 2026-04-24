import { NextRequest } from "next/server";

export function assertAdminRequest(request: NextRequest): { ok: true } | { ok: false; message: string } {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return { ok: false, message: "ADMIN_TOKEN is not configured" };
  }

  const provided = request.headers.get("x-admin-token");
  if (!provided || provided !== expected) {
    return { ok: false, message: "unauthorized" };
  }

  return { ok: true };
}

