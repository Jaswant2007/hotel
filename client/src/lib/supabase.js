import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://mpiyzcvqfqziricgjzzi.supabase.co'

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(
  SUPABASE_ANON_KEY &&
    SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here' &&
    SUPABASE_ANON_KEY.length > 20,
)

// Create Supabase client instance
export const supabase = createClient(
  SUPABASE_URL,
  isSupabaseConfigured ? SUPABASE_ANON_KEY : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

/**
 * Format Indian mobile number to E.164 (+91XXXXXXXXXX)
 */
export function formatPhoneNumber(phone) {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) return `+91${cleaned}`
  if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`
  if (phone.startsWith('+')) return phone
  return `+91${cleaned}`
}

/**
 * Send OTP via Email using Supabase Auth
 */
export async function sendEmailOtp(email) {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase Anon Key is missing. Please add VITE_SUPABASE_ANON_KEY to hotel/client/.env',
    )
  }
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      shouldCreateUser: true,
    },
  })
  if (error) throw error
  return data
}

/**
 * Send OTP via Phone SMS using Supabase Auth
 */
export async function sendPhoneOtp(phone) {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase Anon Key is missing. Please add VITE_SUPABASE_ANON_KEY to hotel/client/.env',
    )
  }
  const formattedPhone = formatPhoneNumber(phone)
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone,
    options: {
      shouldCreateUser: true,
    },
  })
  if (error) throw error
  return data
}

/**
 * Verify Email OTP token (6 digits)
 */
export async function verifyEmailOtp(email, token) {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase Anon Key is missing. Please add VITE_SUPABASE_ANON_KEY to hotel/client/.env',
    )
  }
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'email',
  })
  if (error) throw error
  return data
}

/**
 * Verify Phone SMS OTP token (6 digits)
 */
export async function verifyPhoneOtp(phone, token) {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase Anon Key is missing. Please add VITE_SUPABASE_ANON_KEY to hotel/client/.env',
    )
  }
  const formattedPhone = formatPhoneNumber(phone)
  const { data, error } = await supabase.auth.verifyOtp({
    phone: formattedPhone,
    token: token.trim(),
    type: 'sms',
  })
  if (error) throw error
  return data
}
