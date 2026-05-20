import { z } from 'zod';

export const createCallRequestSchema = z.object({
  toUserId: z.string().min(1),
  anonymous: z.boolean().optional(),
});

export type CreateCallRequestInput = z.infer<typeof createCallRequestSchema>;

