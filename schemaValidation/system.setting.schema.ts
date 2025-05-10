import { z } from "zod";

export const SettingSchema = z.object({
    id: z.string(), // expecting a UUID string
    settingCode: z.string(),
    settingKey: z.string(),
    settingValue: z.number(),
  });
  
  // Optional: Infer TypeScript type from the schema
export type SettingType = z.infer<typeof SettingSchema>;