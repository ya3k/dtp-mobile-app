import { z } from 'zod';

export const PaymentRequestSchema = z.object({
  bookingId: z.string(),
  responseUrl: z.object({
    returnUrl: z.string(),
    cancelUrl: z.string(),
  }),
});

export type PaymentRequestType = z.infer<typeof PaymentRequestSchema>;