import { z } from "zod";

export const addressSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email required"),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  address_line1: z.string().min(4, "Address is required"),
  address_line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "Select a state"),
  pin_code: z.string().regex(/^\d{6}$/, "Enter a 6-digit PIN code"),
});

export const optionalAddressSchema = addressSchema.partial();

export const checkoutFormSchema = z.object({
  billing: addressSchema,
  ship_different: z.boolean().default(false),
  shipping: optionalAddressSchema.optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
