import z from "zod";

export const Signup = z.object({
  name: z.string().min(2).max(30),
  email: z.email().min(1),
  password: z.string().min(8).max(50),
});

export const Signin = z.object({
  email: z.email().min(1),
  password: z.string().min(8).max(50),
});
