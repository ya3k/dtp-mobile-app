import { z } from "zod";

export const TicketScheduleSchema = z.object({
  ticketTypeId: z.string().uuid(),
  ticketKind: z.number().int(),
  netCost: z.number().int(),
  availableTicket: z.number().int(),
  tourScheduleId: z.string().uuid(),
});

export const DayTicketScheduleSchema = z.object({
  day: z.string(), // You could make this stricter with z.string().regex() for date validation if needed
  ticketSchedules: z.array(TicketScheduleSchema),
});

export const FullTicketScheduleSchema = z.array(DayTicketScheduleSchema);

export type TicketScheduleType = z.infer<typeof TicketScheduleSchema>;
export type DayScheduleTicketType = z.infer<typeof DayTicketScheduleSchema>;
export type FullTicketScheduleType = z.infer<typeof FullTicketScheduleSchema>;

