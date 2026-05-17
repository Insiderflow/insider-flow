import { describe, expect, it } from "vitest";
import { isMobileRequest } from "./mobileRequest";

function req(headers: Record<string, string>) {
  return {
    headers: {
      get(name: string) {
        const key = Object.keys(headers).find(
          (k) => k.toLowerCase() === name.toLowerCase(),
        );
        return key ? headers[key]! : null;
      },
    },
  };
}

describe("isMobileRequest", () => {
  it("detects iPhone UA", () => {
    expect(
      isMobileRequest(
        req({
          "user-agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        }),
      ),
    ).toBe(true);
  });

  it("detects Safari desktop mode via Client Hints", () => {
    expect(
      isMobileRequest(
        req({
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
          "sec-ch-ua-mobile": "?1",
        }),
      ),
    ).toBe(true);
  });

  it("detects Cloudflare mobile device type", () => {
    expect(
      isMobileRequest(
        req({
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
          "cf-device-type": "mobile",
        }),
      ),
    ).toBe(true);
  });

  it("ignores desktop Mac without hints", () => {
    expect(
      isMobileRequest(
        req({
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
        }),
      ),
    ).toBe(false);
  });
});
