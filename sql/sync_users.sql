-- Sincronizar usuários existentes
INSERT INTO public.user_profiles (
  user_id,
  name,
  email,
  phone,
  date_of_birth,
  credits_amount,
  plan_type
)
SELECT 
  id as user_id,
  raw_user_meta_data->>'name' as name,
  email,
  raw_user_meta_data->>'phone' as phone,
  (raw_user_meta_data->>'dateOfBirth')::DATE as date_of_birth,
  COALESCE((raw_user_meta_data->>'credits_amount')::INTEGER, 1800) as credits_amount,
  COALESCE(raw_user_meta_data->>'plan_type', 'free') as plan_type
FROM auth.users
WHERE id NOT IN (
  SELECT user_id FROM public.user_profiles
); 