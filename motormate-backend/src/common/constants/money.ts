/**
 * Monetary precision convention for MotorMate.
 *
 * All money fields in the database are DECIMAL(12, 2):
 *   precision  12  — total significant digits
 *   scale       2  — decimal places (cent-level accuracy)
 *   max value      9_999_999_999.99
 *
 * ─── Rules for application code ─────────────────────────────────────────────
 *
 *  1. NEVER use JS `number` for money arithmetic.
 *     Native floats cannot represent decimal fractions exactly:
 *       0.1 + 0.2 === 0.30000000000000004  ← float error
 *
 *  2. Use `Decimal` from `decimal.js` (or the helpers in money.util.ts)
 *     for ALL calculations involving monetary values.
 *
 *  3. Money values arrive from the API as strings (JSON has no Decimal type).
 *     Validate with @IsNumberString() in DTOs and parse via `toMoney()`.
 *
 *  4. Prisma accepts `string | number | Decimal` for Decimal(12,2) fields.
 *     Prefer passing a `Decimal` instance for explicitness.
 *
 *  5. Prisma returns Decimal instances on reads — they serialize to strings
 *     automatically in JSON responses, which is the correct behaviour.
 *
 * ─── References ──────────────────────────────────────────────────────────────
 *  Utility functions : src/common/utils/money.util.ts
 *  Schema definition : prisma/schema.prisma  (@db.Decimal(12, 2))
 */
export const MONEY = {
  /** Total significant digits stored in the DB column */
  PRECISION: 12,
  /** Decimal places — cent-level accuracy */
  SCALE: 2,
  /** Maximum storable value as a string */
  MAX: '9999999999.99',
} as const;
