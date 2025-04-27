import { z } from "zod";

export const destinationSchema = z.object({
    latitude: z.string(),
    longitude: z.string(),
  });
  
export  const tourSchema = z.object({
  thumbnailUrl: z.string(),
    title: z.string(),
    companyName: z.string(),
    description: z.string(),
    avgStar: z.number(),
    totalRating: z.number(),
    onlyFromCost: z.number(),
    id: z.string().uuid(),
    createdAt: z.string().datetime(),
    isDeleted: z.boolean(),
    firstDestination: destinationSchema,
  });
  
export type TourResType = z.infer<typeof tourSchema>;

export const TicketTypeSchema = z.object({
  id: z.string(),
  defaultNetCost: z.number(),
  minimumPurchaseQuantity: z.number(),
  ticketKind: z.number(),
  tourId: z.string(),
});

export const ActivitySchema = z.object({
  name: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  sortOrder: z.number(),
});

export const TourDetailDestinationSchema = z.object({
  name: z.string(),
  imageUrls: z.array(z.string().url()),
  startTime: z.string(),
  endTime: z.string(),
  sortOrder: z.number(),
  sortOrderByDate: z.number(),
  latitude: z.string(),
  longitude: z.string(),
  activities: z.array(ActivitySchema),
});

export const TourDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  companyName: z.string(),
  description: z.string(),
  avgStar: z.number(),
  totalRating: z.number(),
  about: z.string(),
  onlyFromCost: z.number(),
  include: z.string(),
  pickinfor: z.string(),
  ticketTypes: z.array(TicketTypeSchema),
  imageUrls: z.array(z.string().url()),
});

export const TourDetailDataSchema = z.object({
  tour: TourDetailSchema,
  tourDestinations: z.array(TourDetailDestinationSchema),
});

export default TourDetailDataSchema;

export type TourDetailResType = z.infer<typeof TourDetailSchema>;
export type TourDetailDestinationResType = z.infer<typeof TourDetailDestinationSchema>;
export type TourDetailDataResType = z.infer<typeof TourDetailDataSchema>;
export type TicketTypeResType = z.infer<typeof TicketTypeSchema>;
