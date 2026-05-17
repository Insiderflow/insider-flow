import { describe, expect, it } from 'vitest';
import { isMobileUserAgent } from './mobileUserAgent';

describe('isMobileUserAgent', () => {
  it('detects iPhone', () => {
    expect(
      isMobileUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
      )
    ).toBe(true);
  });

  it('ignores desktop Safari', () => {
    expect(
      isMobileUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15'
      )
    ).toBe(false);
  });
});
