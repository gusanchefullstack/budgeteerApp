import { z } from 'zod';

export const registerSchema = z.object({
  firstName: z.string().regex(/^[a-zA-Z]{1,20}$/, 'Max 20 alphabetical characters'),
  lastName:  z.string().regex(/^[a-zA-Z]{1,20}$/, 'Max 20 alphabetical characters'),
  username:  z.string().regex(/^[a-zA-Z0-9]{1,20}$/, 'Max 20 alphanumeric characters'),
  // Spec says max 20, but a short max on raw passwords is a security anti-pattern.
  // We store the bcrypt hash, not the raw value, so there is no DB-level length constraint.
  password:  z.string().min(8, 'Password must be at least 8 characters').max(64),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput    = z.infer<typeof loginSchema>;
