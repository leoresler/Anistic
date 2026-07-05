import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(6, "La contraseña debe tener al menos 6 caracteres");

export const emailAuthSchema = z.object({
  email: z.email("Email invalido").trim().toLowerCase(),
  password: passwordSchema,
});

export const phoneAuthSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/, "Usa formato internacional, por ejemplo +5491112345678"),
  password: passwordSchema,
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(20, "Google idToken invalido"),
});

export type EmailAuthInput = z.infer<typeof emailAuthSchema>;
export type PhoneAuthInput = z.infer<typeof phoneAuthSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  googleId: string | null;
  name: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

export type CurrentUserResponse = {
  user: AuthUser;
};
