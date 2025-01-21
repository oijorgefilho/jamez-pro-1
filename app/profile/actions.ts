'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserProfile(userId: string, name: string, avatarUrl: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('user_profiles')
    .update({ name, avatar_url: avatarUrl })
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating user profile:', error)
    throw new Error('Failed to update user profile')
  }

  // Update auth.users table
  const { error: authUpdateError } = await supabase.auth.updateUser({
    data: { name, avatar_url: avatarUrl }
  })

  if (authUpdateError) {
    console.error('Error updating auth user:', authUpdateError)
    throw new Error('Failed to update auth user')
  }

  revalidatePath('/profile')
}

export async function uploadProfileImage(userId: string, file: File) {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Math.random()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file)

  if (error) {
    console.error('Error uploading file:', error)
    throw new Error('Failed to upload profile image')
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)

  // Update user_metadata with the new avatar URL
  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: publicUrl }
  })

  if (updateError) {
    console.error('Error updating user metadata:', updateError)
    throw new Error('Failed to update user metadata')
  }

  return publicUrl
}

