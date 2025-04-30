import { z } from 'zod';

export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  userName: z.string().min(1),
  balance: z.number(),
  name: z.string().min(1),
  email: z.string().email(),
  phoneNumber: z.string(),
  address: z.string(),
  companyName: z.string().nullable(),
  roleName: z.string(),
  isActive: z.boolean(),
});

export const PUTUserSchema = z.object({
  id: z.string().uuid(),
  userName: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phoneNumber: z.string(),
  address: z.string(),
  roleName: z.string().default('Tourist')
});

// If you want to infer the TypeScript type:
export type UserProfileType = z.infer<typeof UserProfileSchema>;
export type PUTUserType = z.infer<typeof PUTUserSchema>;
