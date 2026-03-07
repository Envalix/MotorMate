import Decimal from 'decimal.js';

// Serializes Decimal instances to strings before NextResponse.json()
// Must be applied to any object containing Prisma money fields.
export function serializeDecimals<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, v) =>
      v instanceof Decimal ? v.toFixed(2) : v,
    ),
  );
}
