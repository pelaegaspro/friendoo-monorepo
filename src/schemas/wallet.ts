import { z } from 'zod';

export const createOrderRequestSchema = z.object({
  userId: z.string().min(1),
  packageId: z.string().min(1),
});

export type CreateOrderRequestInput = z.infer<typeof createOrderRequestSchema>;
