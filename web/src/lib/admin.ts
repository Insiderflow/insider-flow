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

export function assertInternalJobRequest(request: NextRequest): { ok: true } | { ok: false; message: string } {
  const expected = process.env.INTERNAL_JOBS_SECRET;
  if (!expected) {
    return { ok: false, message: "INTERNAL_JOBS_SECRET is not configured" };
  }

  const headerToken = request.headers.get("x-internal-job-token");
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : null;
  const provided = headerToken || bearerToken;

  if (!provided || provided !== expected) {
    return { ok: false, message: "unauthorized" };
  }

  return { ok: true };
}

