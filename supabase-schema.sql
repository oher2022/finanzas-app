-- ============================================================
-- SCHEMA FINANZAS APP
-- Ejecutar en Supabase > SQL Editor
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: categories
-- ============================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '💰',
  color TEXT NOT NULL DEFAULT '#5b7fe8',
  monthly_budget DECIMAL(12,2),
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: transactions
-- ============================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  txn_date DATE NOT NULL,
  merchant TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CLP',
  payment_method TEXT,
  card_last4 TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('gmail', 'manual')),
  is_recurring BOOLEAN DEFAULT FALSE,
  is_reviewed BOOLEAN DEFAULT FALSE,
  installments INTEGER,
  bank_issuer TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: budgets
-- ============================================================
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  period TEXT NOT NULL DEFAULT 'monthly',
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, year, month)
);

-- Presupuesto global mensual (sin category_id)
CREATE TABLE monthly_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

-- ============================================================
-- TABLA: gmail_tokens (encriptado en app layer)
-- ============================================================
CREATE TABLE gmail_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_sync TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: gmail_emails (log de correos procesados)
-- ============================================================
CREATE TABLE gmail_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL,
  raw_subject TEXT,
  raw_snippet TEXT,
  parsed_merchant TEXT,
  parsed_amount DECIMAL(12,2),
  parse_status TEXT DEFAULT 'pending' CHECK (parse_status IN ('pending', 'parsed', 'failed', 'ignored')),
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, gmail_message_id)
);

-- ============================================================
-- TABLA: user_settings (período de facturación y preferencias)
-- ============================================================
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start_day INTEGER DEFAULT 1 CHECK (period_start_day BETWEEN 1 AND 28),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: income_entries (ingresos: sueldo, bonos, abonos)
-- ============================================================
CREATE TABLE income_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_income_user_date ON income_entries(user_id, date DESC);

-- ============================================================
-- COLUMNA: reimbursed_amount en transactions
-- ============================================================
ALTER TABLE transactions ADD COLUMN reimbursed_amount DECIMAL(12,2) NOT NULL DEFAULT 0;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Seguridad por usuario
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_entries ENABLE ROW LEVEL SECURITY;

-- Políticas: solo el dueño puede ver/editar sus datos
CREATE POLICY "user_own_categories" ON categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_budgets" ON budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_monthly_budgets" ON monthly_budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_gmail_tokens" ON gmail_tokens FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_gmail_emails" ON gmail_emails FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_settings" ON user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_income" ON income_entries FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- ÍNDICES para queries frecuentes
-- ============================================================
CREATE INDEX idx_transactions_user_date ON transactions(user_id, txn_date DESC);
CREATE INDEX idx_transactions_user_month ON transactions(user_id, EXTRACT(YEAR FROM txn_date), EXTRACT(MONTH FROM txn_date));
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_gmail_emails_status ON gmail_emails(user_id, parse_status);
CREATE INDEX idx_gmail_emails_msg_id ON gmail_emails(gmail_message_id);

-- ============================================================
-- CATEGORÍAS POR DEFECTO
-- Se insertan via función trigger al crear usuario
-- O manualmente después de crear el primer usuario
-- ============================================================
-- Ejecutar esto después de registrarte, reemplazando TU_USER_ID
-- con tu UUID de Supabase Auth > Users

/*
INSERT INTO categories (user_id, name, icon, color, monthly_budget) VALUES
  ('TU_USER_ID', 'Supermercado', '🛒', '#5b7fe8', 300000),
  ('TU_USER_ID', 'Delivery / Comida', '🍔', '#e05555', 80000),
  ('TU_USER_ID', 'Transporte', '🚗', '#4ec994', 60000),
  ('TU_USER_ID', 'Suscripciones', '📱', '#f0a020', 50000),
  ('TU_USER_ID', 'Entretenimiento', '🎬', '#9b7fe8', 60000),
  ('TU_USER_ID', 'Salud', '💊', '#4ec994', 50000),
  ('TU_USER_ID', 'Ropa / Moda', '👕', '#e05555', 80000),
  ('TU_USER_ID', 'Cafetería', '☕', '#f0a020', 30000),
  ('TU_USER_ID', 'Compras online', '📦', '#5b7fe8', 100000),
  ('TU_USER_ID', 'Combustible', '⛽', '#4ec994', 80000),
  ('TU_USER_ID', 'Educación', '📚', '#9b7fe8', 0),
  ('TU_USER_ID', 'Hogar', '🏠', '#5b7fe8', 100000),
  ('TU_USER_ID', 'Otros', '💰', '#888888', NULL);
*/
