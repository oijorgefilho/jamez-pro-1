-- Atualizar função de reset de créditos
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

-- Atualizar função de adicionar créditos
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_minutes INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
  SET credits_amount = credits_amount + (p_minutes * 60)
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Atualizar função de usar créditos
CREATE OR REPLACE FUNCTION public.use_credits(
  p_user_id UUID,
  p_seconds INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
  SET credits_amount = GREATEST(credits_amount - p_seconds, 0)
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Atualizar função de criação de novo usuário
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
    WHERE user_id = NEW.id OR email = NEW.email
  ) THEN
    RETURN NEW;
  END IF;

  -- Insere o novo perfil
  INSERT INTO public.user_profiles (
    user_id,
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
  RAISE NOTICE 'Erro ao criar perfil do usuário: %', SQLERRM;
  RETURN NEW;
END;
$$; 