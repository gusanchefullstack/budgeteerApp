import { z } from 'zod'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    firstName: z.string().regex(/^[a-zA-Z]{1,20}$/, 'Max 20 alphabetical characters'),
    lastName: z.string().regex(/^[a-zA-Z]{1,20}$/, 'Max 20 alphabetical characters'),
    username: z.string().regex(/^[a-zA-Z0-9]{1,20}$/, 'Max 20 alphanumeric characters'),
    password: z.string().min(8, 'At least 8 characters').max(64),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

// ─── Budget ───────────────────────────────────────────────────────────────────

export const FREQUENCIES = [
  'daily', 'weekly', 'monthly', 'quarterly',
  'semiannually', 'annually', 'onetime',
] as const
export type Frequency = (typeof FREQUENCIES)[number]

export const SECTIONS = ['incomes', 'expenses'] as const
export type Section = (typeof SECTIONS)[number]

export const ITEM_TYPES = ['income', 'expense'] as const
export type ItemType = (typeof ITEM_TYPES)[number]

const nameField = z.string().min(1).max(20)
const frequencyEnum = z.enum(FREQUENCIES)
const sectionEnum = z.enum(SECTIONS)

export const budgetItemSchema = z.object({
  name: nameField,
  plannedDate: z.string().min(1, 'Date required'),
  plannedAmount: z.number().positive('Must be positive'),
  type: z.enum(ITEM_TYPES),
  currency: z.string().length(3, 'Must be a 3-letter ISO 4217 currency code'),
  frequency: frequencyEnum,
})

export const budgetGroupSchema = z.object({
  name: nameField,
  type: sectionEnum,
  budgetItems: z.array(budgetItemSchema).default([]),
})

export const budgetCategorySchema = z.object({
  name: nameField,
  type: sectionEnum,
  budgetGroups: z.array(budgetGroupSchema).default([]),
})

const budgetBaseSchema = z.object({
  name: z.string().regex(/^[a-zA-Z0-9 ]{1,50}$/, 'Max 50 alphanumeric characters (spaces allowed)'),
  beginningDate: z.string().min(1, 'Start date required'),
  endingDate: z.string().min(1, 'End date required'),
  incomes: z.array(budgetCategorySchema).default([]),
  expenses: z.array(budgetCategorySchema).default([]),
})

export const createBudgetSchema = budgetBaseSchema.refine(
  (d) => new Date(d.endingDate) > new Date(d.beginningDate),
  { message: 'End date must be after start date', path: ['endingDate'] },
)

export const updateBudgetSchema = budgetBaseSchema.partial().refine(
  (d) => !d.beginningDate || !d.endingDate || new Date(d.endingDate) > new Date(d.beginningDate),
  { message: 'End date must be after start date', path: ['endingDate'] },
)

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>
export type BudgetItemInput = z.infer<typeof budgetItemSchema>
export type BudgetGroupInput = z.infer<typeof budgetGroupSchema>
export type BudgetCategoryInput = z.infer<typeof budgetCategorySchema>

// Sub-entity schemas
export const createCategorySchema = z.object({
  section: sectionEnum,
  name: nameField,
  budgetGroups: z.array(budgetGroupSchema).default([]),
})

export const updateCategorySchema = z.object({
  section: sectionEnum,
  categoryName: nameField,
  name: nameField.optional(),
})

export const deleteCategorySchema = z.object({
  section: sectionEnum,
  categoryName: nameField,
})

export const createGroupSchema = z.object({
  section: sectionEnum,
  categoryName: nameField,
  name: nameField,
  budgetItems: z.array(budgetItemSchema).default([]),
})

export const updateGroupSchema = z.object({
  section: sectionEnum,
  categoryName: nameField,
  groupName: nameField,
  name: nameField.optional(),
})

export const deleteGroupSchema = z.object({
  section: sectionEnum,
  categoryName: nameField,
  groupName: nameField,
})

export const createItemSchema = z.object({
  section: sectionEnum,
  categoryName: nameField,
  groupName: nameField,
  name: nameField,
  plannedDate: z.string().min(1),
  plannedAmount: z.number().positive(),
  itemType: z.enum(ITEM_TYPES),
  currency: z.string().length(3),
  frequency: frequencyEnum,
})

export const updateItemSchema = z.object({
  section: sectionEnum,
  categoryName: nameField,
  groupName: nameField,
  itemName: nameField,
  name: nameField.optional(),
  plannedDate: z.string().optional(),
  plannedAmount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  frequency: frequencyEnum.optional(),
})

export const deleteItemSchema = z.object({
  section: sectionEnum,
  categoryName: nameField,
  groupName: nameField,
  itemName: nameField,
})

// ─── Transaction ──────────────────────────────────────────────────────────────

export const createTransactionSchema = z.object({
  txdatetime: z.string().min(1, 'Date/time required'),
  txcurrency: z.string().length(3, 'Must be a 3-letter ISO 4217 currency code'),
  txamount: z.number().positive('Must be positive'),
  txtype: z.enum(ITEM_TYPES),
  txcategory: z.string().min(1).max(50),
  txgroup: z.string().min(1).max(50),
  txitem: z.string().min(1).max(50),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>

// ─── API Response Types ───────────────────────────────────────────────────────

export interface User {
  id: string
  firstName: string
  lastName: string
  username: string
}

export interface AuthResponse {
  success: boolean
  token: string
  user: User
}

export interface ItemBucket {
  plannedDate: string
  plannedAmount: number
  currentAmount: number
}

export interface BudgetItem {
  name: string
  plannedDate: string
  plannedAmount: number
  type: ItemType
  currency: string
  frequency: Frequency
  buckets: ItemBucket[]
}

export interface BudgetGroup {
  name: string
  type: string
  budgetItems: BudgetItem[]
}

export interface BudgetCategory {
  name: string
  type: string
  budgetGroups: BudgetGroup[]
}

export interface Budget {
  id: string
  name: string
  beginningDate: string
  endingDate: string
  incomes: BudgetCategory[]
  expenses: BudgetCategory[]
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: string
  txdatetime: string
  txcurrency: string
  txamount: number
  txtype: ItemType
  txcategory: string
  txgroup: string
  txitem: string
  budgetId: string
  userId: string
  createdAt: string
}

export interface PaginatedTransactions {
  data: Transaction[]
  total: number
  page: number
  limit: number
}
