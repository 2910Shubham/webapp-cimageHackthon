import { z } from "zod";

export const roleSchema = z.enum(["USER", "ADMIN", "SUPERADMIN"]);

export type AppRole = z.infer<typeof roleSchema>;

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: roleSchema.optional().default("USER"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const updateRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: roleSchema,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

