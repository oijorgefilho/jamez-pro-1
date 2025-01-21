-- Desabilitar temporariamente o RLS
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Remover as políticas existentes
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert access for service role" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable delete access for service role" ON public.user_profiles;

-- Remover triggers temporariamente
DROP TRIGGER IF EXISTS daily_credit_reset ON public.user_profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar tabela temporária com a nova estrutura
CREATE TABLE public.user_profiles_new (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Copiar dados da tabela antiga para a nova
INSERT INTO public.user_profiles_new (
  user_id,
  name,
  email,
  phone,
  date_of_birth,
  plan_type,
  credits_amount,
  daily_credits_reset,
  created_at,
  updated_at
)
SELECT 
  user_id,
  name,
  email,
  phone,
  date_of_birth,
  plan_type,
  credits_amount,
  daily_credits_reset,
  created_at,
  updated_at
FROM public.user_profiles;

-- Dropar a tabela antiga
DROP TABLE public.user_profiles;

-- Renomear a nova tabela
ALTER TABLE public.user_profiles_new RENAME TO user_profiles;

-- Recriar as políticas
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
USING (auth.uid() = user_id);

CREATE POLICY "Enable delete access for service role"
ON public.user_profiles FOR DELETE
TO service_role
USING (true);

-- Reabilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Recriar o trigger de reset de créditos
CREATE TRIGGER daily_credit_reset
AFTER UPDATE OF daily_credits_reset ON public.user_profiles
FOR EACH STATEMENT
EXECUTE FUNCTION public.reset_daily_credits();

-- Recriar o trigger de criação de usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user(); 