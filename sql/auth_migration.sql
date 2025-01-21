-- Remover funções existentes do auth schema
DROP FUNCTION IF EXISTS auth.add_credits CASCADE;
DROP FUNCTION IF EXISTS auth.use_credits CASCADE;
DROP FUNCTION IF EXISTS auth.reset_daily_credits CASCADE;
DROP FUNCTION IF EXISTS auth.check_daily_credits_reset CASCADE;

-- Remover triggers existentes do auth
DROP TRIGGER IF EXISTS on_daily_credits_reset ON auth.users;

-- Remover políticas existentes do auth
DROP POLICY IF EXISTS "Permitir leitura completa" ON auth.users;
DROP POLICY IF EXISTS "Permitir atualização completa" ON auth.users;
DROP POLICY IF EXISTS update_own_metadata ON auth.users;
DROP POLICY IF EXISTS read_own_user ON auth.users;

-- Remover tabela existente
DROP TABLE IF EXISTS public.user_profiles;

-- Criar tabela user_profiles primeiro
CREATE TABLE public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  credits_amount INTEGER DEFAULT 1800,
  daily_credits_reset TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  plan_type TEXT DEFAULT 'free',
  plan_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Habilitar RLS nas tabelas
ALTER TABLE auth.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso para auth.users
CREATE POLICY "Permitir leitura completa" ON auth.users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir atualização completa" ON auth.users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Criar políticas de acesso para user_profiles
CREATE POLICY "Permitir leitura própria" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Permitir atualização própria" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Garantir permissões necessárias
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON auth.users TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO service_role;

GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT, UPDATE ON auth.users TO authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;

-- Criar funções de sincronização
CREATE OR REPLACE FUNCTION public.sync_profile_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object(
    'name', NEW.name,
    'phone', NEW.phone,
    'dateOfBirth', NEW.date_of_birth,
    'plan_type', NEW.plan_type,
    'credits_amount', NEW.credits_amount,
    'daily_credits_reset', NEW.daily_credits_reset
  )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sync_auth_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id,
    name,
    email,
    phone,
    date_of_birth,
    credits_amount,
    plan_type,
    daily_credits_reset
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    (NEW.raw_user_meta_data->>'dateOfBirth')::DATE,
    COALESCE((NEW.raw_user_meta_data->>'credits_amount')::INTEGER, 1800),
    COALESCE(NEW.raw_user_meta_data->>'plan_type', 'free'),
    COALESCE((NEW.raw_user_meta_data->>'daily_credits_reset')::TIMESTAMP WITH TIME ZONE, CURRENT_TIMESTAMP)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    date_of_birth = EXCLUDED.date_of_birth,
    credits_amount = EXCLUDED.credits_amount,
    plan_type = EXCLUDED.plan_type,
    daily_credits_reset = EXCLUDED.daily_credits_reset,
    updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar triggers de sincronização
CREATE TRIGGER sync_profile_changes
  AFTER INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_auth();

CREATE TRIGGER sync_auth_changes
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_to_profile();

-- Criar funções de créditos no schema auth
CREATE OR REPLACE FUNCTION auth.add_credits(
  p_user_id UUID,
  p_minutes INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_current_credits INTEGER;
BEGIN
  SELECT (raw_user_meta_data->>'credits_amount')::INTEGER 
  INTO v_current_credits 
  FROM auth.users 
  WHERE id = p_user_id;

  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{credits_amount}',
    to_jsonb(COALESCE(v_current_credits, 0) + (p_minutes * 60))
  )
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.use_credits(
  p_user_id UUID,
  p_seconds INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_current_credits INTEGER;
BEGIN
  SELECT (raw_user_meta_data->>'credits_amount')::INTEGER 
  INTO v_current_credits 
  FROM auth.users 
  WHERE id = p_user_id;

  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{credits_amount}',
    to_jsonb(GREATEST(COALESCE(v_current_credits, 0) - p_seconds, 0))
  )
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth.reset_daily_credits()
RETURNS VOID AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{credits_amount}',
      to_jsonb(
        CASE 
          WHEN COALESCE(raw_user_meta_data->>'plan_type', 'free') = 'free' THEN 1800
          WHEN raw_user_meta_data->>'plan_type' = 'pro' THEN 7200
          ELSE 1800
        END
      )
    ),
    '{daily_credits_reset}',
    to_jsonb(CURRENT_TIMESTAMP)
  )
  WHERE raw_user_meta_data->>'plan_type' IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar funções de créditos no schema public
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_minutes INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
  SET 
    credits_amount = credits_amount + (p_minutes * 60),
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.use_credits(
  p_user_id UUID,
  p_seconds INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
  SET 
    credits_amount = GREATEST(credits_amount - p_seconds, 0),
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.reset_daily_credits()
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
  SET 
    credits_amount = CASE 
      WHEN plan_type = 'free' THEN 1800
      WHEN plan_type = 'pro' THEN 7200
      ELSE 1800
    END,
    daily_credits_reset = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE plan_type IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar funções e triggers para reset diário
CREATE OR REPLACE FUNCTION auth.check_daily_credits_reset()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.raw_user_meta_data->>'daily_credits_reset' != NEW.raw_user_meta_data->>'daily_credits_reset' THEN
    PERFORM auth.reset_daily_credits();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.check_daily_credits_reset()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.daily_credits_reset != NEW.daily_credits_reset THEN
    PERFORM public.reset_daily_credits();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_daily_credits_reset_auth
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.check_daily_credits_reset();

CREATE TRIGGER on_daily_credits_reset_profile
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_daily_credits_reset();

-- Garantir permissões para funções
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 