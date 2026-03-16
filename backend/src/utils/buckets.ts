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
    return [makeBucket(item.plannedDate, item)];
  }

  const start = item.plannedDate > beginningDate ? item.plannedDate : beginningDate;
  const buckets: ItemBucket[] = [];
  let current = new Date(start);

  while (current <= endingDate) {
    buckets.push(makeBucket(current, item));
    current = advance(current, item.frequency as Frequency);
  }

  return buckets;
}

function makeBucket(
  date: Date,
  item: Pick<BudgetItem, 'plannedAmount' | 'currency'>,
): ItemBucket {
  return {
    plannedDate:   new Date(date),
    currentDate:   new Date(date),
    plannedAmount: item.plannedAmount,
    currentAmount: 0,
    currency:      item.currency,
  };
}

function advance(date: Date, frequency: Frequency): Date {
  const d = new Date(date);
  switch (frequency) {
    case 'daily':        d.setDate(d.getDate() + 1);       break;
    case 'weekly':       d.setDate(d.getDate() + 7);       break;
    case 'monthly':      d.setMonth(d.getMonth() + 1);     break;
    case 'quarterly':    d.setMonth(d.getMonth() + 3);     break;
    case 'semiannually': d.setMonth(d.getMonth() + 6);     break;
    case 'annually':     d.setFullYear(d.getFullYear() + 1); break;
    default:             d.setFullYear(d.getFullYear() + 100); // safety exit
  }
  return d;
}
