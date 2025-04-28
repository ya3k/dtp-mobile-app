import { z } from 'zod';
export enum PaymentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  PAID = "PAID",
  CANCELED = "CANCELED",
}

export const orderTicketRequestSchema = z.object({
  ticketTypeId: z.string(),
  quantity: z.number().min(1), // Assuming quantity cannot be negative
});

export const orderRequestSchema = z.object({
  tourScheduleId: z.string(),
  name: z.string(),
  phoneNumber: z.string(),
  email: z.string().email(),
  voucherCode: z.string(),
  tickets: z.array(orderTicketRequestSchema),
});

export type OrderRequestType = z.infer<typeof orderRequestSchema>;