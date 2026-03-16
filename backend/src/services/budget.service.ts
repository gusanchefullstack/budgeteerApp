import prisma from '../prisma/client';
import { generateBuckets } from '../utils/buckets';
import { AppError } from '../middleware/AppError';
import type { CreateBudgetInput, UpdateBudgetInput } from '../validators/budget.validators';
import type { BudgetCategory, BudgetGroup, BudgetItem, ItemBucket } from '@prisma/client';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Walk the category/group/item tree and auto-generate buckets for every item.
 */
function applyBuckets(
  categories: CreateBudgetInput['incomes'],
  beginningDate: Date,
  endingDate: Date,
): BudgetCategory[] {
  return categories.map((cat) => ({
    name: cat.name,
    type: cat.type,
    budgetGroups: cat.budgetGroups.map((grp): BudgetGroup => ({
      name: grp.name,
      type: grp.type,
      budgetItems: grp.budgetItems.map((item): BudgetItem => ({
        name:          item.name,
        plannedDate:   item.plannedDate,
        plannedAmount: item.plannedAmount,
        type:          item.type,
        currency:      item.currency,
        frequency:     item.frequency,
        buckets:       generateBuckets(item, beginningDate, endingDate) as ItemBucket[],
      })),
    })),
  }));
}

// ─── Service functions ───────────────────────────────────────────────────────

export async function createBudget(userId: string, data: CreateBudgetInput) {
  const count = await prisma.budget.count({ where: { userId } });
  if (count > 0) {
    throw new AppError(409, 'Only one budget is allowed per user');
  }

  const beginningDate = data.beginningDate;
  const endingDate    = data.endingDate;

  return prisma.budget.create({
    data: {
      name:          data.name,
      userId,
      beginningDate,
      endingDate,
      incomes:       applyBuckets(data.incomes,  beginningDate, endingDate),
      expenses:      applyBuckets(data.expenses, beginningDate, endingDate),
    },
  });
}

export async function getBudgetById(budgetId: string, userId: string) {
  const budget = await prisma.budget.findFirst({ where: { id: budgetId, userId } });
  if (!budget) throw new AppError(404, 'Budget not found');
  return budget;
}

export async function getBudgetTransactions(budgetId: string, userId: string) {
  // Verify ownership first
  await getBudgetById(budgetId, userId);
  return prisma.transaction.findMany({ where: { userId }, orderBy: { txdatetime: 'desc' } });
}

export async function updateBudget(budgetId: string, userId: string, data: UpdateBudgetInput) {
  const existing = await getBudgetById(budgetId, userId);

  const beginningDate = data.beginningDate ?? existing.beginningDate;
  const endingDate    = data.endingDate    ?? existing.endingDate;

  // Re-generate buckets if date range or items changed
  const incomes  = data.incomes  ? applyBuckets(data.incomes,  beginningDate, endingDate) : undefined;
  const expenses = data.expenses ? applyBuckets(data.expenses, beginningDate, endingDate) : undefined;

  return prisma.budget.update({
    where: { id: budgetId },
    data: {
      ...(data.name          && { name: data.name }),
      ...(data.beginningDate && { beginningDate }),
      ...(data.endingDate    && { endingDate }),
      ...(incomes            && { incomes }),
      ...(expenses           && { expenses }),
    },
  });
}

export async function deleteBudget(budgetId: string, userId: string): Promise<void> {
  await getBudgetById(budgetId, userId); // ownership check
  await prisma.budget.delete({ where: { id: budgetId } });
}
