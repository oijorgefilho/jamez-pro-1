-- Primeiro, vamos migrar os dados existentes da user_profiles para auth.users
UPDATE auth.users au
SET raw_user_meta_data = jsonb_build_object(
  'name', up.name,
  'phone', up.phone,
  'date_of_birth', up.date_of_birth,
  'plan_type', up.plan_type,
  'credits_amount', up.credits_amount,
  'daily_credits_reset', up.daily_credits_reset
)
FROM public.user_profiles up
WHERE au.id = up.user_id;

-- Criar funções para manipular créditos diretamente na auth.users
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
    raw_user_meta_data,
    '{credits_amount}',
    to_jsonb(v_current_credits + (p_minutes * 60))
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
    raw_user_meta_data,
    '{credits_amount}',
    to_jsonb(GREATEST(v_current_credits - p_seconds, 0))
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
      raw_user_meta_data,
      '{credits_amount}',
      to_jsonb(
        CASE 
          WHEN raw_user_meta_data->>'plan_type' = 'free' THEN 1800
          WHEN raw_user_meta_data->>'plan_type' = 'pro' THEN 7200
        END
      )
    ),
    '{daily_credits_reset}',
    to_jsonb(CURRENT_TIMESTAMP)
  )
  WHERE raw_user_meta_data->>'plan_type' IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para reset diário de créditos
CREATE OR REPLACE FUNCTION auth.check_daily_credits_reset()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.raw_user_meta_data->>'daily_credits_reset' != NEW.raw_user_meta_data->>'daily_credits_reset' THEN
    PERFORM auth.reset_daily_credits();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_daily_credits_reset ON auth.users;
CREATE TRIGGER on_daily_credits_reset
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.check_daily_credits_reset();

-- Após migrar os dados, podemos dropar a tabela user_profiles
-- DROP TABLE public.user_profiles; 