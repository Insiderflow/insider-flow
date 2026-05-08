import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPublicAppUrlFromEnv,
  getPublicAppUrlOrDefault,
} from "./publicAppUrl";

describe("publicAppUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("getPublicAppUrlFromEnv prefers NEXTAUTH_URL over NEXT_PUBLIC_BASE_URL", () => {
    vi.stubEnv("NEXTAUTH_URL", "https://staging.example.com/");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://wrong.example.com");
    expect(getPublicAppUrlFromEnv()).toBe("https://staging.example.com");
  });

  it("getPublicAppUrlFromEnv falls back to NEXT_PUBLIC_BASE_URL", () => {
    vi.stubEnv("NEXTAUTH_URL", "");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://app.example.com");
    expect(getPublicAppUrlFromEnv()).toBe("https://app.example.com");
  });

  it("getPublicAppUrlFromEnv returns null when unset", () => {
    vi.stubEnv("NEXTAUTH_URL", "");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
    expect(getPublicAppUrlFromEnv()).toBeNull();
  });

  it("getPublicAppUrlOrDefault uses www in production when env missing", () => {
    vi.stubEnv("NEXTAUTH_URL", "");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(getPublicAppUrlOrDefault()).toBe("https://www.insiderflow.asia");
  });

  it("getPublicAppUrlOrDefault uses localhost in development when env missing", () => {
    vi.stubEnv("NEXTAUTH_URL", "");
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(getPublicAppUrlOrDefault()).toBe("http://localhost:3000");
  });
});
