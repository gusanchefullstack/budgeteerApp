import { z } from 'zod';

export const createTransactionSchema = z.object({
  txdatetime: z.coerce.date(),
  txcurrency: z.string().length(3, 'Must be a 3-letter ISO 4217 currency code'),
  txamount:   z.number().positive(),
  txtype:     z.enum(['income', 'expense']),
  txcategory: z.string().min(1).max(50),
  txgroup:    z.string().min(1).max(50),
  txitem:     z.string().min(1).max(50),
});

export const transactionQuerySchema = z.object({
  startDate:  z.coerce.date().optional(),
  endDate:    z.coerce.date().optional(),
  txtype:     z.enum(['income', 'expense']).optional(),
  txcategory: z.string().optional(),
  txgroup:    z.string().optional(),
  txitem:     z.string().optional(),
  txcurrency: z.string().optional(),
}).refine(
  (d) => !d.startDate || !d.endDate || d.endDate >= d.startDate,
  { message: 'endDate must be >= startDate', path: ['endDate'] },
);

export const transactionIdParamsSchema = z.object({
  id: z.string().length(24, 'Must be a valid MongoDB ObjectId'),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type TransactionQuery       = z.infer<typeof transactionQuerySchema>;
