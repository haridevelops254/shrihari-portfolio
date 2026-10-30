import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name.').max(80),
  email: z.string().trim().email('Enter a valid email address.'),
  subject: z.string().trim().min(3, 'Add a short subject.').max(120),
  message: z.string().trim().min(10, 'Write at least 10 characters.').max(2000, 'Keep it under 2000 characters.'),
});
export const loginSchema = z.object({ email: z.string().trim().email('Enter a valid email.'), password: z.string().min(1, 'Enter your password.') });
export const uploadSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(150),
  category: z.string().min(1, 'Choose a category.'),
  customCategory: z.string().trim().max(80).optional(),
  version: z.string().trim().min(1, 'Version is required.').max(40),
  description: z.string().trim().max(1000).optional(),
}).refine((v) => v.category !== 'custom' || !!v.customCategory, { path: ['customCategory'], message: 'Name your custom category.' });
export const passwordSchema = z.object({ current: z.string().min(1, 'Required.'), next: z.string().min(12, 'Use at least 12 characters.'), confirm: z.string() })
  .refine((v) => v.next === v.confirm, { path: ['confirm'], message: 'Passwords do not match.' });

export const publicResumeSchema = z.object({
  id: z.string(), title: z.string(), category_key: z.string(), category_label: z.string(), version: z.string(),
  description: z.string().nullable(), file_size_bytes: z.number(), is_default: z.boolean(), updated_at: z.string().nullable(), published_at: z.string().nullable(),
});
export type PublicResume = z.infer<typeof publicResumeSchema>;

export const adminResumeSchema = z.object({
  id: z.string(), series_id: z.string(), title: z.string(), category: z.string(), category_label: z.string(), custom_category: z.string().nullable(),
  category_key: z.string(), version: z.string(), description: z.string().nullable(), original_filename: z.string(), mime_type: z.string(), file_type: z.string(),
  file_size_bytes: z.number(), checksum_sha256: z.string(), visibility: z.enum(['draft', 'published', 'archived']), is_default_for_category: z.boolean(),
  created_at: z.string().nullable(), updated_at: z.string().nullable(), published_at: z.string().nullable(),
});
export type AdminResume = z.infer<typeof adminResumeSchema>;
export type FieldErrors = Record<string, string>;
export const fieldErrors = (e: z.ZodError): FieldErrors => {
  const out: FieldErrors = {};
  for (const i of e.issues) { const k = String(i.path[0] ?? '_'); if (!out[k]) out[k] = i.message; }
  return out;
};
