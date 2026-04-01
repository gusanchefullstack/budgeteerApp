import prisma from '../prisma/client';
import { generateBuckets } from '../utils/buckets';
import { AppError } from '../middleware/AppError';
import type {
  CreateBudgetInput, UpdateBudgetInput,
  CreateCategoryInput, UpdateCategoryInput, DeleteCategoryInput,
  CreateGroupInput, UpdateGroupInput, DeleteGroupInput,
  CreateItemInput, UpdateItemInput, DeleteItemInput,
} from '../validators/budget.validators';
import type { Budget, BudgetCategory, BudgetGroup, BudgetItem, ItemBucket } from '@prisma/client';

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

// Minimal structural type satisfied by both Prisma's BudgetCategory[] and Zod-inferred input arrays.
type NameTree = Array<{
  name: string;
  budgetGroups: Array<{
    name: string;
    budgetItems: Array<{ name: string }>;
  }>;
}>;

/** All category names across both sections. */
function allCategoryNames(budget: Budget): string[] {
  return [...budget.incomes, ...budget.expenses].map((c) => c.name);
}

/** All group names across the entire budget (both sections). */
function allGroupNames(budget: Budget): string[] {
  return [...budget.incomes, ...budget.expenses].flatMap((c) =>
    c.budgetGroups.map((g) => g.name),
  );
}

/** All item names across the entire budget (both sections). */
function allItemNames(budget: Budget): string[] {
  return [...budget.incomes, ...budget.expenses].flatMap((c) =>
    c.budgetGroups.flatMap((g) => g.budgetItems.map((i) => i.name)),
  );
}

/**
 * Assert that category, group, and item names are globally unique within a
 * combined incomes+expenses structure. Used on create and full-replace updates.
 */
function assertNamesUnique(incomes: NameTree, expenses: NameTree): void {
  const allCats = [...incomes, ...expenses];

  const catNames = allCats.map((c) => c.name);
  const dupCat = catNames.find((n, i) => catNames.indexOf(n) !== i);
  if (dupCat) throw new AppError(409, `Duplicate category name "${dupCat}"`);

  const grpNames = allCats.flatMap((c) => c.budgetGroups.map((g) => g.name));
  const dupGrp = grpNames.find((n, i) => grpNames.indexOf(n) !== i);
  if (dupGrp) throw new AppError(409, `Duplicate group name "${dupGrp}"`);

  const itemNames = allCats.flatMap((c) =>
    c.budgetGroups.flatMap((g) => g.budgetItems.map((i) => i.name)),
  );
  const dupItem = itemNames.find((n, i) => itemNames.indexOf(n) !== i);
  if (dupItem) throw new AppError(409, `Duplicate item name "${dupItem}"`);
}

// ─── Service functions ───────────────────────────────────────────────────────

export async function createBudget(userId: string, data: CreateBudgetInput) {
  const count = await prisma.budget.count({ where: { userId } });
  if (count > 0) {
    throw new AppError(409, 'Only one budget is allowed per user');
  }

  assertNamesUnique(data.incomes, data.expenses);

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

export async function getBudgetByUser(userId: string) {
  return prisma.budget.findFirst({ where: { userId } });
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

  // Validate global name uniqueness across the effective combined structure
  const effectiveIncomes  = (data.incomes  ?? existing.incomes)  as NameTree;
  const effectiveExpenses = (data.expenses ?? existing.expenses) as NameTree;
  assertNamesUnique(effectiveIncomes, effectiveExpenses);

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

// ─── Sub-entity traversal helpers ────────────────────────────────────────────

type Section = 'incomes' | 'expenses';

function getCategories(budget: Budget, section: Section): BudgetCategory[] {
  return section === 'incomes' ? budget.incomes : budget.expenses;
}

function locateCategory(
  budget: Budget,
  section: Section,
  categoryName: string,
): { categories: BudgetCategory[]; catIdx: number } {
  const categories = getCategories(budget, section);
  const catIdx = categories.findIndex((c) => c.name === categoryName);
  if (catIdx === -1) throw new AppError(404, `Category "${categoryName}" not found`);
  return { categories, catIdx };
}

function locateGroup(
  budget: Budget,
  section: Section,
  categoryName: string,
  groupName: string,
): { categories: BudgetCategory[]; catIdx: number; grpIdx: number } {
  const { categories, catIdx } = locateCategory(budget, section, categoryName);
  const grpIdx = categories[catIdx].budgetGroups.findIndex((g) => g.name === groupName);
  if (grpIdx === -1) throw new AppError(404, `Group "${groupName}" not found`);
  return { categories, catIdx, grpIdx };
}

function locateItem(
  budget: Budget,
  section: Section,
  categoryName: string,
  groupName: string,
  itemName: string,
): { categories: BudgetCategory[]; catIdx: number; grpIdx: number; itemIdx: number } {
  const { categories, catIdx, grpIdx } = locateGroup(budget, section, categoryName, groupName);
  const itemIdx = categories[catIdx].budgetGroups[grpIdx].budgetItems.findIndex(
    (i) => i.name === itemName,
  );
  if (itemIdx === -1) throw new AppError(404, `Item "${itemName}" not found`);
  return { categories, catIdx, grpIdx, itemIdx };
}

/** Collect all BudgetItem names nested under a list of categories (for transaction cleanup). */
function collectItemNames(categories: BudgetCategory[]): string[] {
  return categories.flatMap((cat) =>
    cat.budgetGroups.flatMap((grp) => grp.budgetItems.map((item) => item.name)),
  );
}

/** Write back the mutated incomes or expenses array to MongoDB. */
async function saveSection(budgetId: string, section: Section, categories: BudgetCategory[]) {
  return prisma.budget.update({
    where: { id: budgetId },
    data: section === 'incomes' ? { incomes: categories } : { expenses: categories },
  });
}

// ─── Category service functions ───────────────────────────────────────────────

export async function addCategory(budgetId: string, userId: string, data: CreateCategoryInput) {
  const budget = await getBudgetById(budgetId, userId);
  const categories = getCategories(budget, data.section);

  if (allCategoryNames(budget).includes(data.name)) {
    throw new AppError(409, `Category "${data.name}" already exists`);
  }

  const existingGroupNames = allGroupNames(budget);
  for (const grp of data.budgetGroups) {
    if (existingGroupNames.includes(grp.name)) {
      throw new AppError(409, `Group "${grp.name}" already exists`);
    }
  }

  const existingItemNames = allItemNames(budget);
  for (const grp of data.budgetGroups) {
    for (const item of grp.budgetItems) {
      if (existingItemNames.includes(item.name)) {
        throw new AppError(409, `Item "${item.name}" already exists`);
      }
    }
  }

  const newCategory: BudgetCategory = {
    name: data.name,
    type: data.section,
    budgetGroups: data.budgetGroups.map((grp): BudgetGroup => ({
      name: grp.name,
      type: data.section,
      budgetItems: grp.budgetItems.map((item): BudgetItem => ({
        name:          item.name,
        plannedDate:   item.plannedDate,
        plannedAmount: item.plannedAmount,
        type:          item.type,
        currency:      item.currency,
        frequency:     item.frequency,
        buckets:       generateBuckets(item, budget.beginningDate, budget.endingDate) as ItemBucket[],
      })),
    })),
  };

  categories.push(newCategory);
  return saveSection(budgetId, data.section, categories);
}

export async function updateCategory(budgetId: string, userId: string, data: UpdateCategoryInput) {
  const budget = await getBudgetById(budgetId, userId);
  const { categories, catIdx } = locateCategory(budget, data.section, data.categoryName);

  if (data.name && data.name !== data.categoryName) {
    if (allCategoryNames(budget).filter((n) => n !== data.categoryName).includes(data.name)) {
      throw new AppError(409, `Category "${data.name}" already exists`);
    }
    categories[catIdx].name = data.name;
  }

  const result = await saveSection(budgetId, data.section, categories);

  if (data.name && data.name !== data.categoryName) {
    await prisma.transaction.updateMany({
      where: { userId, txcategory: data.categoryName },
      data:  { txcategory: data.name },
    });
  }

  return result;
}

export async function deleteCategory(budgetId: string, userId: string, data: DeleteCategoryInput) {
  const budget = await getBudgetById(budgetId, userId);
  const { categories, catIdx } = locateCategory(budget, data.section, data.categoryName);

  const itemNames = collectItemNames([categories[catIdx]]);
  categories.splice(catIdx, 1);

  await saveSection(budgetId, data.section, categories);

  if (itemNames.length > 0) {
    await prisma.transaction.deleteMany({ where: { userId, txitem: { in: itemNames } } });
  }
}

// ─── Group service functions ──────────────────────────────────────────────────

export async function addGroup(budgetId: string, userId: string, data: CreateGroupInput) {
  const budget = await getBudgetById(budgetId, userId);
  const { categories, catIdx } = locateCategory(budget, data.section, data.categoryName);

  if (allGroupNames(budget).includes(data.name)) {
    throw new AppError(409, `Group "${data.name}" already exists`);
  }

  const existingItemNames = allItemNames(budget);
  for (const item of data.budgetItems) {
    if (existingItemNames.includes(item.name)) {
      throw new AppError(409, `Item "${item.name}" already exists`);
    }
  }

  const newGroup: BudgetGroup = {
    name: data.name,
    type: data.section,
    budgetItems: data.budgetItems.map((item): BudgetItem => ({
      name:          item.name,
      plannedDate:   item.plannedDate,
      plannedAmount: item.plannedAmount,
      type:          item.type,
      currency:      item.currency,
      frequency:     item.frequency,
      buckets:       generateBuckets(item, budget.beginningDate, budget.endingDate) as ItemBucket[],
    })),
  };

  categories[catIdx].budgetGroups.push(newGroup);
  return saveSection(budgetId, data.section, categories);
}

export async function updateGroup(budgetId: string, userId: string, data: UpdateGroupInput) {
  const budget = await getBudgetById(budgetId, userId);
  const { categories, catIdx, grpIdx } = locateGroup(
    budget, data.section, data.categoryName, data.groupName,
  );

  if (data.name && data.name !== data.groupName) {
    if (allGroupNames(budget).filter((n) => n !== data.groupName).includes(data.name)) {
      throw new AppError(409, `Group "${data.name}" already exists`);
    }
    categories[catIdx].budgetGroups[grpIdx].name = data.name;
  }

  const result = await saveSection(budgetId, data.section, categories);

  if (data.name && data.name !== data.groupName) {
    await prisma.transaction.updateMany({
      where: { userId, txgroup: data.groupName },
      data:  { txgroup: data.name },
    });
  }

  return result;
}

export async function deleteGroup(budgetId: string, userId: string, data: DeleteGroupInput) {
  const budget = await getBudgetById(budgetId, userId);
  const { categories, catIdx, grpIdx } = locateGroup(
    budget, data.section, data.categoryName, data.groupName,
  );

  const itemNames = categories[catIdx].budgetGroups[grpIdx].budgetItems.map((i) => i.name);
  categories[catIdx].budgetGroups.splice(grpIdx, 1);

  await saveSection(budgetId, data.section, categories);

  if (itemNames.length > 0) {
    await prisma.transaction.deleteMany({ where: { userId, txitem: { in: itemNames } } });
  }
}

// ─── Item service functions ───────────────────────────────────────────────────

export async function addItem(budgetId: string, userId: string, data: CreateItemInput) {
  const budget = await getBudgetById(budgetId, userId);
  const { categories, catIdx, grpIdx } = locateGroup(
    budget, data.section, data.categoryName, data.groupName,
  );

  if (allItemNames(budget).includes(data.name)) {
    throw new AppError(409, `Item "${data.name}" already exists`);
  }

  const newItem: BudgetItem = {
    name:          data.name,
    plannedDate:   data.plannedDate,
    plannedAmount: data.plannedAmount,
    type:          data.itemType,   // remap from body field to model field
    currency:      data.currency,
    frequency:     data.frequency,
    buckets:       generateBuckets(
      { plannedDate: data.plannedDate, plannedAmount: data.plannedAmount, currency: data.currency, frequency: data.frequency },
      budget.beginningDate,
      budget.endingDate,
    ) as ItemBucket[],
  };

  categories[catIdx].budgetGroups[grpIdx].budgetItems.push(newItem);
  return saveSection(budgetId, data.section, categories);
}

export async function updateItem(budgetId: string, userId: string, data: UpdateItemInput) {
  const budget = await getBudgetById(budgetId, userId);
  const { categories, catIdx, grpIdx, itemIdx } = locateItem(
    budget, data.section, data.categoryName, data.groupName, data.itemName,
  );

  const item = categories[catIdx].budgetGroups[grpIdx].budgetItems[itemIdx];

  if (data.name && data.name !== data.itemName) {
    if (allItemNames(budget).filter((n) => n !== data.itemName).includes(data.name)) {
      throw new AppError(409, `Item "${data.name}" already exists`);
    }
    item.name = data.name;
  }

  // Apply scalar updates
  if (data.plannedDate   !== undefined) item.plannedDate   = data.plannedDate;
  if (data.plannedAmount !== undefined) item.plannedAmount = data.plannedAmount;
  if (data.currency      !== undefined) item.currency      = data.currency;
  if (data.frequency     !== undefined) item.frequency     = data.frequency;

  // Regenerate buckets if any bucket-affecting field changed (resets currentAmount to 0)
  const bucketFieldChanged =
    data.plannedDate !== undefined ||
    data.plannedAmount !== undefined ||
    data.currency !== undefined ||
    data.frequency !== undefined;

  if (bucketFieldChanged) {
    item.buckets = generateBuckets(
      { plannedDate: item.plannedDate, plannedAmount: item.plannedAmount, currency: item.currency, frequency: item.frequency },
      budget.beginningDate,
      budget.endingDate,
    ) as ItemBucket[];
  }

  const result = await saveSection(budgetId, data.section, categories);

  if (data.name && data.name !== data.itemName) {
    await prisma.transaction.updateMany({
      where: { userId, txitem: data.itemName },
      data:  { txitem: data.name },
    });
  }

  return result;
}

export async function deleteItem(budgetId: string, userId: string, data: DeleteItemInput) {
  const budget = await getBudgetById(budgetId, userId);
  const { categories, catIdx, grpIdx, itemIdx } = locateItem(
    budget, data.section, data.categoryName, data.groupName, data.itemName,
  );

  categories[catIdx].budgetGroups[grpIdx].budgetItems.splice(itemIdx, 1);

  await saveSection(budgetId, data.section, categories);
  await prisma.transaction.deleteMany({ where: { userId, txitem: data.itemName } });
}
