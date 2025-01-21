-- Remover triggers
DROP TRIGGER IF EXISTS sync_profile_changes ON public.user_profiles;
DROP TRIGGER IF EXISTS sync_auth_changes ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_daily_credits_reset_auth ON auth.users;
DROP TRIGGER IF EXISTS on_daily_credits_reset_profile ON public.user_profiles;

-- Remover funções
DROP FUNCTION IF EXISTS public.sync_profile_to_auth() CASCADE;
DROP FUNCTION IF EXISTS auth.sync_auth_to_profile() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS auth.check_daily_credits_reset() CASCADE;
DROP FUNCTION IF EXISTS public.check_daily_credits_reset() CASCADE;
DROP FUNCTION IF EXISTS auth.add_credits() CASCADE;
DROP FUNCTION IF EXISTS auth.use_credits() CASCADE;
DROP FUNCTION IF EXISTS auth.reset_daily_credits() CASCADE;
DROP FUNCTION IF EXISTS public.add_credits() CASCADE;
DROP FUNCTION IF EXISTS public.use_credits() CASCADE;
DROP FUNCTION IF EXISTS public.reset_daily_credits() CASCADE;
DROP FUNCTION IF EXISTS public.sync_users_safely() CASCADE;

-- Remover políticas
DROP POLICY IF EXISTS "Permitir leitura própria" ON public.user_profiles;
DROP POLICY IF EXISTS "Permitir atualização própria" ON public.user_profiles;
DROP POLICY IF EXISTS "Permitir inserção própria" ON public.user_profiles;
DROP POLICY IF EXISTS "Permitir leitura completa" ON auth.users;
DROP POLICY IF EXISTS "Permitir atualização completa" ON auth.users;
DROP POLICY IF EXISTS "Permitir inserção" ON auth.users;

-- Remover tabelas
DROP TABLE IF EXISTS public.user_profiles CASCADE; 