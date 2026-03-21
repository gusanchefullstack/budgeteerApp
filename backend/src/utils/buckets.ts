import type { BudgetItem, ItemBucket } from '@prisma/client';

type Frequency = BudgetItem['frequency'];

/**
 * Generates ItemBuckets for a BudgetItem based on its frequency and the
 * parent budget's date range.
 *
 * Rules:
 * - Start from max(beginningDate, item.plannedDate)
 * - Advance by the frequency interval until endingDate is exceeded
 * - "onetime" always produces exactly one bucket at item.plannedDate
 * - Each bucket copies plannedAmount and currency from the item;
 *   currentAmount starts at 0
 */
export function generateBuckets(
  item: Pick<BudgetItem, 'plannedDate' | 'plannedAmount' | 'currency' | 'frequency'>,
  beginningDate: Date,
  endingDate: Date,
): ItemBucket[] {
  if (item.frequency === 'onetime') {
    return [makeBucket(item)];
  }

  const start = item.plannedDate > beginningDate ? item.plannedDate : beginningDate;
  const buckets: ItemBucket[] = [];
  let current = new Date(start);

  while (current <= endingDate) {
    buckets.push(makeBucket(item));
    current = advance(current, item.frequency as Frequency);
  }

  return buckets;
}

function makeBucket(
  item: Pick<BudgetItem, 'plannedDate' | 'plannedAmount' | 'currency'>,
): ItemBucket {
  return {
    plannedDate:   new Date(item.plannedDate), // copied from parent item — never changes
    currentDate:   new Date(item.plannedDate), // starts equal to plannedDate; updated to txdatetime on allocation
    plannedAmount: item.plannedAmount,
    currentAmount: 0,
    currency:      item.currency,
  };
}

function advance(date: Date, frequency: Frequency): Date {
  const d = new Date(date);
  // Use UTC methods to avoid local-timezone day drift on month/year boundaries
  switch (frequency) {
    case 'daily':        d.setUTCDate(d.getUTCDate() + 1);         break;
    case 'weekly':       d.setUTCDate(d.getUTCDate() + 7);         break;
    case 'monthly':      d.setUTCMonth(d.getUTCMonth() + 1);       break;
    case 'quarterly':    d.setUTCMonth(d.getUTCMonth() + 3);       break;
    case 'semiannually': d.setUTCMonth(d.getUTCMonth() + 6);       break;
    case 'annually':     d.setUTCFullYear(d.getUTCFullYear() + 1); break;
    default:             d.setUTCFullYear(d.getUTCFullYear() + 100); // safety exit
  }
  return d;
}
