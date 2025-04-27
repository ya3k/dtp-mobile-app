import { z } from "zod";

export const loginSchema = z.object({
    userName: z.string().min(1, "Tên đăng nhập không được để trống"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự bao gồm chữ hoa, chữ thường và số"),
})

export const loginResSchema = z.object({
    tokenType: z.string(),
    accessToken: z.string(),
    expiresIn: z.number(),
    refreshToken: z.string(),
    role: z.string(),
})

export type LoginSchemaType = z.infer<typeof loginSchema>;
export type LoginResType = z.infer<typeof loginResSchema>;