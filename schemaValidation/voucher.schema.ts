import { z } from "zod";

export const voucherSchema = z.object({
  id: z.string().uuid(),
  expiryDate: z.string(),
  code: z.string(),
  maxDiscountAmount: z.number().nonnegative(),
  percent: z.number().min(0).max(1),
  quantity: z.number().int().min(0),
  availableVoucher: z.number().int().min(0),
  description: z.string(),
  createdAt: z.string(),
  isDeleted: z.boolean(),
});


export type VoucherResType = z.infer<typeof voucherSchema>;
