import { z } from 'zod';


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


export const OrderDetailTicketSchema = z.object({
  code: z.string(),
  ticketTypeId: z.string(),
  quantity: z.number().int(),
  grossCost: z.number(),
  ticketKind: z.number()
});

export const OrderDetailSchema = z.object({
  tourId: z.string().uuid(),
  code: z.string(),
  refCode: z.number(),
  name: z.string(),
  phoneNumber: z.string(),
  email: z.string().email(),
  tourName: z.string(),
  tourThumbnail: z.string().url(),
  tourScheduleId: z.string().uuid(),
  tourDate: z.string().datetime(),
  orderDate: z.string().datetime(),
  orderTickets: z.array(OrderDetailTicketSchema),
  discountAmount: z.number(),
  grossCost: z.number(),
  netCost: z.number(),
  status: z.number(),
  paymentLinkId: z.string(),
  paymentStatus: z.number()
});

export type OrderDetailType = z.infer<typeof OrderDetailSchema>;