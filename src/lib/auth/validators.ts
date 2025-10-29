import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Wprowadź poprawny adres email."),
  password: z.string().min(8, "Hasło musi mieć min. 8 znaków."),
});

export const SignupSchema = z
  .object({
    email: z.string().email("Wprowadź poprawny adres email."),
    password: z
      .string()
      .min(8, "Hasło musi mieć min. 8 znaków.")
      .regex(/[A-Za-z]/, "Hasło musi zawierać literę.")
      .regex(/\d/, "Hasło musi zawierać cyfrę."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są zgodne.",
    path: ["confirmPassword"],
  });

export const RecoverSchema = z.object({
  email: z.string().email("Wprowadź poprawny adres email."),
  redirectTo: z.string().url().optional(),
});

export type LoginFormValues = z.infer<typeof LoginSchema>;
export type SignupFormValues = z.infer<typeof SignupSchema>;
export type RecoverFormValues = z.infer<typeof RecoverSchema>;
