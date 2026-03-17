import { z } from 'zod';

const budgetItemSchema = z.object({
  name:          z.string().max(20, 'Max 20 characters'),
  plannedDate:   z.coerce.date(),
  plannedAmount: z.number().positive(),
  type:          z.enum(['income', 'expense']),
  currency:      z.string().length(3, 'Must be a 3-letter ISO 4217 currency code'),
  frequency:     z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'semiannually', 'annually', 'onetime']),
  // buckets are auto-generated — never accepted from the client
});

const budgetGroupSchema = z.object({
  name:        z.string().max(20, 'Max 20 characters'),
  type:        z.enum(['incomes', 'expenses']),
  budgetItems: z.array(budgetItemSchema).optional().default([]),
});

const budgetCategorySchema = z.object({
  name:         z.string().max(20, 'Max 20 characters'),
  type:         z.enum(['incomes', 'expenses']),
  budgetGroups: z.array(budgetGroupSchema).optional().default([]),
});

// Base shape without refinement — used to derive the partial (PATCH) schema
const budgetBaseSchema = z.object({
  name:          z.string().regex(/^[a-zA-Z0-9 ]{1,50}$/, 'Max 50 alphanumeric characters (spaces allowed)'),
  beginningDate: z.coerce.date(),
  endingDate:    z.coerce.date(),
  incomes:       z.array(budgetCategorySchema).optional().default([]),
  expenses:      z.array(budgetCategorySchema).optional().default([]),
});

export const createBudgetSchema = budgetBaseSchema.refine(
  (d) => d.endingDate > d.beginningDate,
  { message: 'endingDate must be after beginningDate', path: ['endingDate'] },
);

// Zod v4: .partial() cannot be called on a refined schema — derive from base
export const updateBudgetSchema = budgetBaseSchema.partial().refine(
  (d) => !d.beginningDate || !d.endingDate || d.endingDate > d.beginningDate,
  { message: 'endingDate must be after beginningDate', path: ['endingDate'] },
);

export const budgetIdParamsSchema = z.object({
  id: z.string().length(24, 'Must be a valid MongoDB ObjectId'),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

// ─── Sub-entity validators ────────────────────────────────────────────────────
// All operations identify the target through the ancestor chain in the body.
// `section` discriminates budget.incomes vs budget.expenses at every level.

const sectionEnum    = z.enum(['incomes', 'expenses']);
const nameField      = z.string().min(1).max(20);
const frequencyEnum  = z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'semiannually', 'annually', 'onetime']);

// ── Category ─────────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  section:      sectionEnum,
  name:         nameField,
  budgetGroups: z.array(budgetGroupSchema).optional().default([]),
});

export const updateCategorySchema = z.object({
  section:      sectionEnum,
  categoryName: nameField,               // current name — locator
  name:         nameField.optional(),    // new name
});

export const deleteCategorySchema = z.object({
  section:      sectionEnum,
  categoryName: nameField,
});

// ── Group ─────────────────────────────────────────────────────────────────────

export const createGroupSchema = z.object({
  section:      sectionEnum,
  categoryName: nameField,
  name:         nameField,
  budgetItems:  z.array(budgetItemSchema).optional().default([]),
});

export const updateGroupSchema = z.object({
  section:      sectionEnum,
  categoryName: nameField,
  groupName:    nameField,               // current name — locator
  name:         nameField.optional(),    // new name
});

export const deleteGroupSchema = z.object({
  section:      sectionEnum,
  categoryName: nameField,
  groupName:    nameField,
});

// ── Item ──────────────────────────────────────────────────────────────────────
// NOTE: BudgetItem.type ('income'|'expense') conflicts with the routing
// discriminator ('incomes'|'expenses'). The body uses `itemType` for the
// item-level field and `section` for the routing discriminator.

export const createItemSchema = z.object({
  section:       sectionEnum,
  categoryName:  nameField,
  groupName:     nameField,
  name:          nameField,
  plannedDate:   z.coerce.date(),
  plannedAmount: z.number().positive(),
  itemType:      z.enum(['income', 'expense']),
  currency:      z.string().length(3, 'Must be a 3-letter ISO 4217 currency code'),
  frequency:     frequencyEnum,
});

export const updateItemSchema = z.object({
  section:       sectionEnum,
  categoryName:  nameField,
  groupName:     nameField,
  itemName:      nameField,              // current name — locator
  name:          nameField.optional(),   // new name
  plannedDate:   z.coerce.date().optional(),
  plannedAmount: z.number().positive().optional(),
  currency:      z.string().length(3).optional(),
  frequency:     frequencyEnum.optional(),
});

export const deleteItemSchema = z.object({
  section:      sectionEnum,
  categoryName: nameField,
  groupName:    nameField,
  itemName:     nameField,
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
export type CreateGroupInput    = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput    = z.infer<typeof updateGroupSchema>;
export type DeleteGroupInput    = z.infer<typeof deleteGroupSchema>;
export type CreateItemInput     = z.infer<typeof createItemSchema>;
export type UpdateItemInput     = z.infer<typeof updateItemSchema>;
export type DeleteItemInput     = z.infer<typeof deleteItemSchema>;
