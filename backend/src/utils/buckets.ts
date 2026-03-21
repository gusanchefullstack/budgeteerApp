import type { BudgetItem, ItemBucket } from '@prisma/client';

type Frequency = BudgetItem['frequency'];

/**
 * Generates ItemBuckets for a BudgetItem based on calendar periods.
 *
 * Each bucket corresponds to one calendar period (day / Mon–Sun week / month /
 * quarter / half-year / year) that overlaps with [beginningDate, endingDate].
 * Partial first and last periods are included.
 *
 * plannedDate on each bucket = the item's day pattern applied to that period
 * (e.g. monthly with item.plannedDate on the 15th → bucket for May has May 15).
 * currentDate starts equal to plannedDate and is updated to txdatetime on allocation.
 */
export function generateBuckets(
  item: Pick<BudgetItem, 'plannedDate' | 'plannedAmount' | 'currency' | 'frequency'>,
  beginningDate: Date,
  endingDate: Date,
): ItemBucket[] {
  if (item.frequency === 'onetime') {
    return [makeBucket(item.plannedDate, item.plannedAmount, item.currency)];
  }

  const periods = getCalendarPeriodDates(
    item.plannedDate,
    beginningDate,
    endingDate,
    item.frequency as Frequency,
  );
  return periods.map((date) => makeBucket(date, item.plannedAmount, item.currency));
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function makeBucket(plannedDate: Date, plannedAmount: number, currency: string): ItemBucket {
  return {
    plannedDate:   new Date(plannedDate),
    currentDate:   new Date(plannedDate), // updated to txdatetime on allocation
    plannedAmount,
    currentAmount: 0,
    currency,
  };
}

/** Creates a UTC-midnight Date, capping day to the last valid day of that month. */
function utcDate(year: number, month: number, day: number): Date {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDay)));
}

function getCalendarPeriodDates(
  itemDate: Date,
  beginningDate: Date,
  endingDate: Date,
  frequency: Frequency,
): Date[] {
  switch (frequency) {
    case 'daily':        return getDailyDates(beginningDate, endingDate);
    case 'weekly':       return getWeeklyDates(itemDate, beginningDate, endingDate);
    case 'monthly':      return getMonthlyDates(itemDate, beginningDate, endingDate);
    case 'quarterly':    return getQuarterlyDates(itemDate, beginningDate, endingDate);
    case 'semiannually': return getSemiannualDates(itemDate, beginningDate, endingDate);
    case 'annually':     return getAnnualDates(itemDate, beginningDate, endingDate);
    default:             return [];
  }
}

/** One bucket per calendar day in [beginningDate, endingDate]. */
function getDailyDates(beginningDate: Date, endingDate: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(Date.UTC(
    beginningDate.getUTCFullYear(),
    beginningDate.getUTCMonth(),
    beginningDate.getUTCDate(),
  ));
  while (current <= endingDate) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

/**
 * One bucket per Mon–Sun calendar week that overlaps with [beginningDate, endingDate].
 * plannedDate = the same weekday as item.plannedDate within each week.
 */
function getWeeklyDates(itemDate: Date, beginningDate: Date, endingDate: Date): Date[] {
  const dates: Date[] = [];
  // Convert Sunday=0 JS weekday to Mon=0..Sun=6
  const itemDow = (itemDate.getUTCDay() + 6) % 7;
  const beginDow = (beginningDate.getUTCDay() + 6) % 7;

  // Monday of the week containing beginningDate
  const monday = new Date(Date.UTC(
    beginningDate.getUTCFullYear(),
    beginningDate.getUTCMonth(),
    beginningDate.getUTCDate() - beginDow,
  ));

  while (monday <= endingDate) {
    const bucketDate = new Date(monday);
    bucketDate.setUTCDate(bucketDate.getUTCDate() + itemDow);
    dates.push(bucketDate);
    monday.setUTCDate(monday.getUTCDate() + 7);
  }
  return dates;
}

/**
 * One bucket per calendar month that overlaps with [beginningDate, endingDate].
 * plannedDate = item's day-of-month in each month (capped to last day of month).
 */
function getMonthlyDates(itemDate: Date, beginningDate: Date, endingDate: Date): Date[] {
  const dates: Date[] = [];
  const day = itemDate.getUTCDate();

  let year  = beginningDate.getUTCFullYear();
  let month = beginningDate.getUTCMonth();

  while (utcDate(year, month, 1) <= endingDate) {
    dates.push(utcDate(year, month, day));
    if (++month > 11) { month = 0; year++; }
  }
  return dates;
}

/**
 * One bucket per calendar quarter (Jan–Mar, Apr–Jun, Jul–Sep, Oct–Dec)
 * that overlaps with [beginningDate, endingDate].
 * plannedDate = item's month-offset-within-quarter and day applied to each quarter.
 */
function getQuarterlyDates(itemDate: Date, beginningDate: Date, endingDate: Date): Date[] {
  const dates: Date[] = [];
  const day                  = itemDate.getUTCDate();
  const monthOffsetInPeriod  = itemDate.getUTCMonth() % 3; // 0 | 1 | 2

  let year         = beginningDate.getUTCFullYear();
  let quarterStart = Math.floor(beginningDate.getUTCMonth() / 3) * 3; // 0 | 3 | 6 | 9

  while (utcDate(year, quarterStart, 1) <= endingDate) {
    dates.push(utcDate(year, quarterStart + monthOffsetInPeriod, day));
    quarterStart += 3;
    if (quarterStart > 11) { quarterStart = 0; year++; }
  }
  return dates;
}

/**
 * One bucket per half-year (Jan–Jun = H1, Jul–Dec = H2)
 * that overlaps with [beginningDate, endingDate].
 * plannedDate = item's month-offset-within-half and day applied to each half.
 */
function getSemiannualDates(itemDate: Date, beginningDate: Date, endingDate: Date): Date[] {
  const dates: Date[] = [];
  const day                 = itemDate.getUTCDate();
  const monthOffsetInPeriod = itemDate.getUTCMonth() % 6; // 0..5

  let year      = beginningDate.getUTCFullYear();
  let halfStart = Math.floor(beginningDate.getUTCMonth() / 6) * 6; // 0 | 6

  while (utcDate(year, halfStart, 1) <= endingDate) {
    dates.push(utcDate(year, halfStart + monthOffsetInPeriod, day));
    halfStart += 6;
    if (halfStart > 11) { halfStart = 0; year++; }
  }
  return dates;
}

/**
 * One bucket per calendar year that overlaps with [beginningDate, endingDate].
 * plannedDate = item's month and day applied to each year.
 */
function getAnnualDates(itemDate: Date, beginningDate: Date, endingDate: Date): Date[] {
  const dates: Date[] = [];
  const month = itemDate.getUTCMonth();
  const day   = itemDate.getUTCDate();

  let year = beginningDate.getUTCFullYear();

  while (utcDate(year, 0, 1) <= endingDate) {
    dates.push(utcDate(year, month, day));
    year++;
  }
  return dates;
}
