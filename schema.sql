-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table with credits
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'pro')),
  credits_amount INTEGER NOT NULL DEFAULT 1800,
  daily_credits_reset TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Permitir leitura do próprio perfil" ON public.user_profiles;
DROP POLICY IF EXISTS "Permitir atualização do próprio perfil" ON public.user_profiles;
DROP POLICY IF EXISTS "Permitir inserção durante registro" ON public.user_profiles;
DROP POLICY IF EXISTS "Permitir leitura para verificar email existente" ON public.user_profiles;
DROP POLICY IF EXISTS "Permitir acesso service role" ON public.user_profiles;

-- Criar novas políticas
CREATE POLICY "Enable read access for authenticated users"
ON public.user_profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for service role"
ON public.user_profiles FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Enable delete access for service role"
ON public.user_profiles FOR DELETE
TO service_role
USING (true);

-- Function to reset daily credits
CREATE OR REPLACE FUNCTION public.reset_daily_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Reset credits based on plan type
  UPDATE public.user_profiles
  SET credits_amount = 
    CASE 
      WHEN plan_type = 'free' THEN 1800  -- 30 minutes in seconds
      WHEN plan_type = 'pro' THEN 7200   -- 120 minutes in seconds
    END,
  daily_credits_reset = CURRENT_TIMESTAMP;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS daily_credit_reset ON public.user_profiles;

-- Recreate the trigger for daily credit reset
CREATE TRIGGER daily_credit_reset
AFTER UPDATE OF daily_credits_reset ON public.user_profiles
FOR EACH STATEMENT
EXECUTE FUNCTION public.reset_daily_credits();

-- Function to add credits
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_minutes INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
  SET credits_amount = credits_amount + (p_minutes * 60)
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to use credits
CREATE OR REPLACE FUNCTION public.use_credits(
  p_user_id UUID,
  p_seconds INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
  SET credits_amount = GREATEST(credits_amount - p_seconds, 0)
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_date_of_birth DATE;
BEGIN
  -- Tenta converter a data de nascimento com tratamento de erro
  BEGIN
    v_date_of_birth := (NEW.raw_user_meta_data->>'dateOfBirth')::DATE;
  EXCEPTION WHEN OTHERS THEN
    v_date_of_birth := NULL;
  END;

  -- Verifica se já existe um perfil para este usuário
  IF EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = NEW.id OR email = NEW.email
  ) THEN
    RETURN NEW;
  END IF;

  -- Insere o novo perfil
  INSERT INTO public.user_profiles (
    id,
    name,
    email,
    phone,
    date_of_birth,
    plan_type,
    credits_amount,
    daily_credits_reset
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    v_date_of_birth,
    'free',
    1800,
    CURRENT_TIMESTAMP
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log do erro (você pode personalizar isso)
  RAISE NOTICE 'Erro ao criar perfil do usuário: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Create the trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

