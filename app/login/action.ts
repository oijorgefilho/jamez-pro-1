'use server'

import { supabase } from '@/lib/supabase'
import { log } from '@/utils/logger'

export async function loginUser(email: string, password: string) {
  log.info(`Attempting login for user: ${email}`)
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // Update user status to online
    if (data.user) {
      await supabase
        .from('users')
        .update({ status: 'online', last_login: new Date().toISOString() })
        .eq('id', data.user.id)
    }

    log.info('Login successful')
    return { success: true, data }
  } catch (error) {
    log.error('Login error:', error)
    throw error
  }
}

export async function resetPassword(email: string) {
  log.info(`Requesting password reset for: ${email}`)
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) throw error

    log.info('Password reset email sent')
    return { success: true }
  } catch (error) {
    log.error('Password reset error:', error)
    throw error
  }
}

