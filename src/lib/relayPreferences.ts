import { z } from "zod";

export const templateSchema = z.enum([
  "default",
  "executive",
  "sales",
  "engineering",
]);
export const preferencesSchema = z.object({
  defaultTemplate: templateSchema.default("default"),
  autoExtractActions: z.boolean().default(true),
  autoRecordMode: z
    .enum(["all", "external", "internal", "manual"])
    .default("external"),
  consentPreference: z.enum(["remember", "required"]).default("remember"),
  botDisplayName: z.string().trim().min(1).max(80).default("Relay Notetaker"),
  defaultVisibility: z.enum(["private", "team", "public"]).default("team"),
  showTimestamps: z.boolean().default(true),
  momentTypes: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        color: z.string().regex(/^#[0-9a-f]{6}$/i),
      }),
    )
    .min(1)
    .max(30)
    .default([
      { name: "Highlight", color: "#53745b" },
      { name: "Positive Reaction", color: "#10b981" },
      { name: "Needs Review", color: "#b78036" },
      { name: "Feedback", color: "#b86444" },
    ]),
});
export type RelayPreferences = z.infer<typeof preferencesSchema>;
export const defaultPreferences = (): RelayPreferences =>
  preferencesSchema.parse({});
export const sessionPreferencesSchema = z.object({
  template: templateSchema.optional(),
  visibility: z.enum(["personal", "team"]).optional(),
});
