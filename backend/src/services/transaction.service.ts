import prisma from '../prisma/client';
import { AppError } from '../middleware/AppError';
import type { CreateTransactionInput, TransactionQuery } from '../validators/transaction.validators';
import type { BudgetItem } from '@prisma/client';

// ─── Bucket allocation ───────────────────────────────────────────────────────

/**
 * Returns the index of the bucket whose plannedDate is closest to txdatetime.
 * Returns -1 only if the item has no buckets.
 */
function findBucketIndex(item: BudgetItem, txdatetime: Date): number {
  let best     = -1;
  let bestDiff = Infinity;
  item.buckets.forEach((bucket, idx) => {
    const diff = Math.abs(txdatetime.getTime() - bucket.plannedDate.getTime());
    if (diff < bestDiff) { bestDiff = diff; best = idx; }
  });
  return best;
}

/**
 * After creating a transaction, finds the matching BudgetItem by txitem name
 * and allocates the txamount to the best-matching ItemBucket.
 * Silently skips if no matching budget or item is found (transaction still saved).
 */
async function allocateToItemBucket(
  userId: string,
  txitem: string,
  txdatetime: Date,
  txamount: number,
): Promise<void> {
  const budget = await prisma.budget.findFirst({ where: { userId } });
  if (!budget) return;

  // Search both incomes and expenses for the matching BudgetItem
  const allCategories = [...budget.incomes, ...budget.expenses];
  let foundCatIdx    = -1;
  let foundGrpIdx    = -1;
  let foundItemIdx   = -1;
  let foundBucketIdx = -1;
  let inIncomes      = true;

  outer: for (const [ci, cat] of allCategories.entries()) {
    const isIncomeCat = ci < budget.incomes.length;
    for (const [gi, grp] of cat.budgetGroups.entries()) {
      for (const [ii, item] of grp.budgetItems.entries()) {
        if (item.name === txitem) {
          const bucketIdx = findBucketIndex(item, txdatetime);
          if (bucketIdx !== -1) {
            foundCatIdx    = isIncomeCat ? ci : ci - budget.incomes.length;
            foundGrpIdx    = gi;
            foundItemIdx   = ii;
            foundBucketIdx = bucketIdx;
            inIncomes      = isIncomeCat;
            break outer;
          }
        }
      }
    }
  }

  if (foundBucketIdx === -1) return; // no matching bucket — allocation skipped

  // Mutate the embedded document in memory then write back
  const categories = inIncomes ? budget.incomes : budget.expenses;
  const bucket = categories[foundCatIdx]
    .budgetGroups[foundGrpIdx]
    .budgetItems[foundItemIdx]
    .buckets[foundBucketIdx];

  bucket.currentAmount += txamount;
  bucket.currentDate    = txdatetime;

  await prisma.budget.update({
    where: { id: budget.id },
    data:  inIncomes ? { incomes: budget.incomes } : { expenses: budget.expenses },
  });
}

// ─── Service functions ───────────────────────────────────────────────────────

export async function createTransaction(userId: string, data: CreateTransactionInput) {
  const transaction = await prisma.transaction.create({
    data: { userId, ...data },
  });

  // Fire-and-forget allocation — does not fail the transaction creation
  allocateToItemBucket(userId, data.txitem, data.txdatetime, data.txamount).catch(
    (err) => console.error('[allocateToItemBucket]', err),
  );

  return transaction;
}

export async function getTransactions(userId: string) {
  return prisma.transaction.findMany({
    where:   { userId },
    orderBy: { txdatetime: 'desc' },
  });
}

export async function getFilteredTransactions(userId: string, filters: TransactionQuery) {
  return prisma.transaction.findMany({
    where: {
      userId,
      ...(filters.startDate || filters.endDate
        ? {
            txdatetime: {
              ...(filters.startDate && { gte: filters.startDate }),
              ...(filters.endDate   && { lte: filters.endDate }),
            },
          }
        : {}),
      ...(filters.txtype     && { txtype:     filters.txtype }),
      ...(filters.txcategory && { txcategory: filters.txcategory }),
      ...(filters.txgroup    && { txgroup:    filters.txgroup }),
      ...(filters.txitem     && { txitem:     filters.txitem }),
      ...(filters.txcurrency && { txcurrency: filters.txcurrency }),
    },
    orderBy: { txdatetime: 'desc' },
  });
}

export async function getTransactionById(userId: string, txId: string) {
  const tx = await prisma.transaction.findFirst({ where: { id: txId, userId } });
  if (!tx) throw new AppError(404, 'Transaction not found');
  return tx;
}
