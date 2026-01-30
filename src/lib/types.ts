import { z } from "zod";

export const idCardSchema = z.object({
  template: z.string().default("student"),
  name: z.string().min(2, "Name must be at least 2 characters."),
  idNumber: z.string().min(4, "ID must be at least 4 characters."),
  dob: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  validUntil: z.string().optional(),
  photo: z.string().optional(),
});

export type IDCardData = z.infer<typeof idCardSchema>;

export interface TemplateField {
  name: keyof Omit<IDCardData, "template" | "photo">;
  label: string;
  placeholder: string;
  type: "text" | "date";
}

export interface Template {
  id: string;
  name: string;
  fields: TemplateField[];
}
