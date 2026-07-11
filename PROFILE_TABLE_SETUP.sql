-- Criar tabela de profiles
-- Execute este SQL no Supabase SQL Editor para criar a tabela de perfil dos usuários

CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  institution TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para buscar perfil por user_id
CREATE INDEX profiles_user_id_idx ON profiles(user_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários lerem seu próprio perfil
CREATE POLICY "Usuários podem ler seu próprio perfil"
  ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para usuários atualizarem seu próprio perfil
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários criarem seu próprio perfil
CREATE POLICY "Usuários podem criar seu próprio perfil"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários deletarem seu próprio perfil
CREATE POLICY "Usuários podem deletar seu próprio perfil"
  ON profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar função para criar perfil automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, '');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para chamar a função ao criar novo usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
