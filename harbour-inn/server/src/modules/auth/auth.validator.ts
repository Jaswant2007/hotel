import { z } from 'zod';
import { isDisposableEmail } from '../otp/disposable-email';

export const RequestOtpSchema = z.object({
  email: z
    .string({ required_error: 'Email address is required.' })
    .email('Please enter a valid email address.')
    .max(255, 'Email is too long.')
    .refine((val) => !isDisposableEmail(val), {
      message: 'Temporary or disposable email providers are not permitted for hotel reservations.',
    }),
  purpose: z.enum(['signup', 'login'], {
    required_error: 'Purpose (signup or login) is required.',
  }),
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  consent: z.boolean().optional(),
});

export const VerifyOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  code: z
    .string()
    .trim()
    .length(6, 'Verification code must be exactly 6 digits.')
    .regex(/^\d{6}$/, 'Verification code must consist of digits only.'),
  purpose: z.enum(['signup', 'login']),
});

export const ResendOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  purpose: z.enum(['signup', 'login']),
});

export const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100).optional(),
  phone: z.string().trim().max(30).optional(),
});
