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
