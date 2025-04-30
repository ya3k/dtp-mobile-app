import { z } from "zod";

export const walletSchema = z.object({
    userId: z.string(),
    balance: z.number()

})

export type WalletType = z.infer<typeof walletSchema>