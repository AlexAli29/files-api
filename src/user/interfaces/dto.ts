import z from 'zod';

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/,
);
const idSchema = z.union(
  [z.email(), z.string().regex(phoneRegex)],
  'id must be an email or phone number',
);

export const SignUpSchema = z.object({
  id: idSchema,
  password: z.string().min(8).max(32),
});

export type SignUpDto = z.infer<typeof SignUpSchema>;

export const SignInSchema = z.object({
  id: idSchema,
  password: z.string().min(8).max(32),
});

export type SignInDto = z.infer<typeof SignUpSchema>;
