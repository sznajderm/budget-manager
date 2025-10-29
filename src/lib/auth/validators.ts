import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

// API schema for signup (without confirmPassword)
export const SignupApiSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Za-z]/, "Password must contain a letter.")
    .regex(/\d/, "Password must contain a number."),
});

// Frontend schema for signup (with confirmPassword)
export const SignupSchema = z
  .object({
    email: z.string().email("Enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Za-z]/, "Password must contain a letter.")
      .regex(/\d/, "Password must contain a number."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const RecoverSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  redirectTo: z.string().url().optional(),
});

export type LoginFormValues = z.infer<typeof LoginSchema>;
export type SignupFormValues = z.infer<typeof SignupSchema>;
export type RecoverFormValues = z.infer<typeof RecoverSchema>;
