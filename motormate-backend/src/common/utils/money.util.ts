import Decimal from 'decimal.js';
import { MONEY } from '../constants/money';

// Configure Decimal.js globally to match the DB column precision.
// This must run before any Decimal arithmetic in the process.
Decimal.set({
  precision: MONEY.PRECISION + MONEY.SCALE,
  rounding: Decimal.ROUND_HALF_UP,
});

export { Decimal };

/**
 * Parse a raw money value from an API request into a Decimal instance.
 *
 * - Accepts strings ("15000.00") or numbers (15000).
 * - Rejects NaN, Infinity, and negative values.
 * - Result is safe to pass directly to any Prisma Decimal(12,2) field.
 *
 * @example
 *   toMoney('15000.50')  // → Decimal { value: '15000.50' }
 *   toMoney(15000)       // → Decimal { value: '15000' }
 */
export function toMoney(value: string | number): Decimal {
  const d = new Decimal(value);
  if (!d.isFinite()) throw new Error(`Invalid money value: ${value}`);
  if (d.isNegative())
    throw new Error(`Money value must be non-negative: ${value}`);
  return d;
}

/**
 * Format a Decimal (or Decimal-compatible object) for display or JSON output.
 * Always returns a string with exactly 2 decimal places — never a JS float.
 *
 * @example
 *   formatMoney(new Decimal('15000'))  // → "15000.00"
 *   formatMoney(null)                  // → null
 */
export function formatMoney(
  value: { toFixed: (dp: number) => string } | null | undefined,
): string | null {
  if (value == null) return null;
  return value.toFixed(MONEY.SCALE);
}

/**
 * Add two money values without float error.
 * Both inputs are coerced via `toMoney` before addition.
 *
 * @example
 *   addMoney('10.10', '0.20')  // → Decimal { value: '10.30' }  (not 10.299999…)
 */
export function addMoney(
  a: string | number | Decimal,
  b: string | number | Decimal,
): Decimal {
  return new Decimal(a.toString()).plus(new Decimal(b.toString()));
}

/**
 * Subtract `b` from `a` without float error.
 * Returns a non-negative result; throws if the result would be negative.
 *
 * @example
 *   subtractMoney('15000.00', '12000.00')  // → Decimal { value: '3000.00' }
 */
export function subtractMoney(
  a: string | number | Decimal,
  b: string | number | Decimal,
): Decimal {
  const result = new Decimal(a.toString()).minus(new Decimal(b.toString()));
  if (result.isNegative())
    throw new Error(
      `Subtraction resulted in negative money: ${result.toString()}`,
    );
  return result;
}

/**
 * Calculate profit for a vehicle: sellingPrice − purchasePrice − totalExpenses.
 * Returns a signed Decimal (negative = loss).
 *
 * @example
 *   calculateProfit('20000', '15000', '500')  // → Decimal { value: '4500.00' }
 */
export function calculateProfit(
  sellingPrice: string | number | Decimal,
  purchasePrice: string | number | Decimal,
  totalExpenses: string | number | Decimal = 0,
): Decimal {
  return new Decimal(sellingPrice.toString())
    .minus(new Decimal(purchasePrice.toString()))
    .minus(new Decimal(totalExpenses.toString()));
}
