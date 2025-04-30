import { z } from 'zod';

export enum TicketKind {
  Adult = 0,
  Child = 1,
  PerGroupOfThree = 2,
  PerGroupOfFive = 3,
  PerGroupOfSeven = 4,
  PerGroupOfTen = 5,
}

export enum OrderStatus {
  SUBMITTED = 0,
  AWAITING_PAYMENT = 1,
  COMPLETED = 2,
  CANCELLED = 3,
  PAID = 4,
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


export const OrderTicketSchema = z.object({
  code: z.string(),
  ticketTypeId: z.string().uuid(),
  quantity: z.number().int().min(1),
  grossCost: z.number(),
  ticketKind: z.number(), // 0 or 1
});

export const TourOrderSchema = z.object({
  orderId: z.string().uuid(),
  tourName: z.string(),
  tourId: z.string().uuid(),
  tourThumbnail: z.string().url(),
  tourDate: z.string(),
  orderTickets: z.array(OrderTicketSchema),
  finalCost: z.number(),
  canRating: z.boolean(),
  status: z.number(), // could refine to enum if needed
});

export type OrderHistoryType = z.infer<typeof TourOrderSchema>;