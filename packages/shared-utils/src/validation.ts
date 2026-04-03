import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export const dateRangeSchema = z.object({
  start_date: z.string().date(),
  end_date: z.string().date(),
});

export const moneySchema = z
  .string()
  .regex(/^-?\d{1,12}\.\d{2}$/, 'Must be a valid monetary amount (e.g., 1234.56)');

export const einSchema = z
  .string()
  .regex(/^\d{2}-\d{7}$/, 'Must be a valid EIN (XX-XXXXXXX)');

export const vinSchema = z
  .string()
  .length(17)
  .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'Must be a valid 17-character VIN');

export const phoneSchema = z
  .string()
  .regex(/^\+?1?\d{10,15}$/, 'Must be a valid phone number');

export const stateCodeSchema = z
  .string()
  .length(2)
  .regex(/^[A-Z]{2}$/, 'Must be a valid 2-letter US state code');

export type PaginationInput = z.infer<typeof paginationSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
