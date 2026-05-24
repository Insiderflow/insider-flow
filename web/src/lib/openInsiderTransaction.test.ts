import { describe, expect, it } from 'vitest';
import {
  isOpenInsider10b51,
  isOpenInsiderBuy,
  isOpenInsiderOption,
  isOpenInsiderSell,
  openInsiderMarketSide,
} from './openInsiderTransaction';

describe('openInsiderTransaction', () => {
  it('counts only P as market buy', () => {
    expect(isOpenInsiderBuy('P - Purchase')).toBe(true);
    expect(isOpenInsiderBuy('A - Award')).toBe(false);
    expect(isOpenInsiderBuy('A - Derivative_Purchase')).toBe(false);
    expect(isOpenInsiderBuy('F - Tax')).toBe(false);
    expect(isOpenInsiderBuy('C - Conversion')).toBe(false);
    expect(isOpenInsiderBuy('M - Exercise')).toBe(false);
  });

  it('counts only S as market sell', () => {
    expect(isOpenInsiderSell('S - Sale')).toBe(true);
    expect(isOpenInsiderSell('S - Sale+OE')).toBe(true);
    expect(isOpenInsiderSell('M - Derivative_Sale')).toBe(false);
    expect(isOpenInsiderSell('J - Derivative_Sale')).toBe(false);
  });

  it('detects 10b5-1 from +OE', () => {
    expect(isOpenInsider10b51('S - Sale+OE')).toBe(true);
    expect(isOpenInsider10b51('S - Sale')).toBe(false);
  });

  it('classifies non P/S as option activity', () => {
    expect(isOpenInsiderOption('A - Award')).toBe(true);
    expect(isOpenInsiderOption('F - Tax')).toBe(true);
    expect(isOpenInsiderOption('C - Conversion')).toBe(true);
    expect(isOpenInsiderOption('P - Purchase')).toBe(false);
    expect(isOpenInsiderOption('S - Sale')).toBe(false);
  });

  it('CRWV filing mix: conversions are not buys', () => {
    expect(isOpenInsiderBuy('C - Conversion')).toBe(false);
    expect(isOpenInsiderSell('S - Sale')).toBe(true);
    expect(openInsiderMarketSide('C - Conversion')).toBeNull();
  });
});
