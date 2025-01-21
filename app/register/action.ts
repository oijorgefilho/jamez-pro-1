'use server'

import { supabase } from '@/lib/supabase'
import { log } from '@/utils/logger'

export async function registerUser(name: string, email: string, password: string) {
  log.info(`Registering new user: ${email}`)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  })

  if (error) {
    log.error('Registration error:', error)
    throw new Error(error.message)
  }

  if (data.user) {
    log.info(`Creating user profile for: ${data.user.id}`)
    await supabase.from('usuarios').insert({
      id: data.user.id,
      nome: name,
      email: email,
      acesso: 'jogador',
      status: 'offline',
    })
  }

  log.info('User registered successfully')
  return data
}

