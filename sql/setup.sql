-- Remover RLS do auth.users (não é recomendado ter RLS nesta tabela)
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- Remover políticas existentes do auth.users
DROP POLICY IF EXISTS "Permitir leitura própria" ON auth.users;
DROP POLICY IF EXISTS "Permitir atualização própria" ON auth.users;

-- Criar tabela user_profiles
CREATE TABLE public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  credits_amount INTEGER DEFAULT 1800,
  plan_type TEXT DEFAULT 'free'
);

-- Habilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "Permitir leitura própria" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Permitir atualização própria" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Permitir inserção própria" ON public.user_profiles
  FOR INSERT WITH CHECK (true);

-- Trigger para criar perfil quando usuário for criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id,
    name,
    email,
    phone,
    date_of_birth,
    credits_amount,
    plan_type
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    (NEW.raw_user_meta_data->>'dateOfBirth')::DATE,
    COALESCE((NEW.raw_user_meta_data->>'credits_amount')::INTEGER, 1800),
    COALESCE(NEW.raw_user_meta_data->>'plan_type', 'free')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar auth quando mudar créditos ou plano
CREATE OR REPLACE FUNCTION public.sync_credits_and_plan()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.credits_amount != OLD.credits_amount OR NEW.plan_type != OLD.plan_type) THEN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_build_object(
      'name', NEW.name,
      'phone', NEW.phone,
      'dateOfBirth', NEW.date_of_birth,
      'credits_amount', NEW.credits_amount,
      'plan_type', NEW.plan_type
    )
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_credits_and_plan
  AFTER UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_credits_and_plan();

-- Permissões básicas
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_profiles TO anon;
GRANT ALL ON public.user_profiles TO authenticated; 