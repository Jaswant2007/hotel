import { createClient } from '@supabase/supabase-js'

export const DEFAULT_SUPABASE_URL = 'https://mpiyzcvqfqziricgjzzi.supabase.co'
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1waXl6Y3ZxZnF6aXJpY2dqenppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwODk0MjEsImV4cCI6MjEwNzY2NTQyMX0.j2-awO-IluHunP-lZGV8xlNOaIo-Z4A7W4u2J1tFP1U'

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.startsWith('http')
    ? import.meta.env.VITE_SUPABASE_URL
    : DEFAULT_SUPABASE_URL

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here' &&
  import.meta.env.VITE_SUPABASE_ANON_KEY.length > 20
    ? import.meta.env.VITE_SUPABASE_ANON_KEY
    : DEFAULT_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(
  SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 20,
)

// Create Supabase client with robust local storage persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
})

/**
 * Format user-friendly error messages from Supabase Auth responses
 */
export function formatAuthError(err) {
  if (!err) return 'An unexpected error occurred. Please try again.'
  const msg = err.message || (typeof err === 'string' ? err : 'Authentication error')
  const code = err.code || ''

  if (
    code === 'otp_expired' ||
    msg.toLowerCase().includes('expired') ||
    msg.toLowerCase().includes('token has expired') ||
    msg.toLowerCase().includes('invalid token')
  ) {
    return 'Invalid or expired 6-digit verification code. Please check the latest code in your inbox or request a new one.'
  }

  if (
    code === 'over_email_send_rate_limit' ||
    code === '429' ||
    msg.toLowerCase().includes('rate limit') ||
    msg.toLowerCase().includes('60 seconds')
  ) {
    return 'For security, please wait 60 seconds before requesting another verification code.'
  }

  if (
    code === 'email_address_invalid' ||
    msg.toLowerCase().includes('email address') ||
    msg.toLowerCase().includes('invalid')
  ) {
    return 'Please enter a valid, active email address (e.g. name@gmail.com).'
  }

  if (msg.toLowerCase().includes('signups not allowed')) {
    return 'Account registration is currently locked. Please contact support.'
  }

  if (err.isNetwork || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
    return 'Network connection issue. Please check your internet connection and try again.'
  }

  return msg
}

/**
 * Send OTP via Email using Supabase Auth
 */
export async function sendEmailOtp(email) {
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address.')
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email: cleanEmail,
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
  const cleanPhone = phone.replace(/\D/g, '')
  const formatted = cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`

  const { data, error } = await supabase.auth.signInWithOtp({
    phone: formatted,
    options: {
      shouldCreateUser: true,
    },
  })

  if (error) throw error
  return data
}

/**
 * Verify Email OTP token (supports both 'email' and 'signup' types)
 */
export async function verifyEmailOtp(email, token) {
  const cleanEmail = email.trim().toLowerCase()
  const cleanToken = token.trim()

  if (!cleanToken || cleanToken.length !== 6) {
    throw new Error('Please enter the complete 6-digit code.')
  }

  // 1. Attempt standard signInWithOtp verification
  const res = await supabase.auth.verifyOtp({
    email: cleanEmail,
    token: cleanToken,
    type: 'email',
  })

  if (!res.error) return res.data

  // 2. If 'email' type fails, try 'signup' in case Supabase treated new user as signup confirmation
  if (res.error.code === 'otp_expired' || res.error.message?.toLowerCase().includes('invalid')) {
    try {
      const fallbackRes = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'signup',
      })
      if (!fallbackRes.error) return fallbackRes.data
    } catch {
      // Ignore fallback exception and throw original error
    }
  }

  throw res.error
}

/**
 * Verify Phone SMS OTP token
 */
export async function verifyPhoneOtp(phone, token) {
  const cleanPhone = phone.replace(/\D/g, '')
  const formatted = cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`
  const cleanToken = token.trim()

  const { data, error } = await supabase.auth.verifyOtp({
    phone: formatted,
    token: cleanToken,
    type: 'sms',
  })

  if (error) throw error
  return data
}
