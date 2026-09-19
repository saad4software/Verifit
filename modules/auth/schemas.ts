import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .email("Please enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Please enter your full name."),
    email: z
      .string()
      .trim()
      .min(1, "Please enter your email address.")
      .email("Please enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1, "Display name cannot be empty."),
  image: z
    .string()
    .trim()
    .url("Please enter a valid URL.")
    .or(z.literal(""))
    .optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const passwordUpdateSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Please enter your current password."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters long."),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  });

export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>;
