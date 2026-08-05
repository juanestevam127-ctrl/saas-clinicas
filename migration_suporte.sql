-- ============================================================
-- migration_suporte.sql
-- Cole este SQL inteiro no Supabase SQL Editor e clique em RUN
-- ============================================================

-- ============================================================
-- TABELA: TICKETS DE SUPORTE
-- ============================================================
CREATE TABLE IF NOT EXISTS sistema_clinicas_agenciaduo_suporte_tickets (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinica_id      UUID        NOT NULL REFERENCES sistema_clinicas_agenciaduo_clinicas(id) ON DELETE CASCADE,
  usuario_id      UUID        NOT NULL REFERENCES sistema_clinicas_agenciaduo_profissionais(id),
  assunto         TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'aberto', -- aberto|respondido|resolvido
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: MENSAGENS DE SUPORTE
-- ============================================================
CREATE TABLE IF NOT EXISTS sistema_clinicas_agenciaduo_suporte_mensagens (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id       UUID        NOT NULL REFERENCES sistema_clinicas_agenciaduo_suporte_tickets(id) ON DELETE CASCADE,
  remetente_tipo  TEXT        NOT NULL, -- 'cliente' ou 'master'
  remetente_id    TEXT        NOT NULL, -- ID do profissional ou 'master'
  remetente_nome  TEXT        NOT NULL,
  mensagem        TEXT,
  anexo_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_suporte_tickets_clinica ON sistema_clinicas_agenciaduo_suporte_tickets(clinica_id);
CREATE INDEX IF NOT EXISTS idx_suporte_tickets_status ON sistema_clinicas_agenciaduo_suporte_tickets(status);
CREATE INDEX IF NOT EXISTS idx_suporte_mensagens_ticket ON sistema_clinicas_agenciaduo_suporte_mensagens(ticket_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE sistema_clinicas_agenciaduo_suporte_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sistema_clinicas_agenciaduo_suporte_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_suporte_tickets"
  ON sistema_clinicas_agenciaduo_suporte_tickets FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "service_role_full_access_suporte_mensagens"
  ON sistema_clinicas_agenciaduo_suporte_mensagens FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ============================================================
-- TRIGGERS: auto-updated_at
-- ============================================================
CREATE TRIGGER set_updated_at_suporte_tickets
  BEFORE UPDATE ON sistema_clinicas_agenciaduo_suporte_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- INSTRUÇÕES PARA O BUCKET DE IMAGENS
-- ============================================================
-- NOTA: Execute isso para garantir que o bucket existe publicamente
INSERT INTO storage.buckets (id, name, public)
VALUES ('imagens-suporte-marcai', 'imagens-suporte-marcai', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Permissões para o bucket (service role / all)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'imagens-suporte-marcai' );

CREATE POLICY "Auth Upload Access"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'imagens-suporte-marcai' );

CREATE POLICY "Auth Delete Access"
ON storage.objects FOR DELETE
USING ( bucket_id = 'imagens-suporte-marcai' );

SELECT 'Módulo de Suporte configurado com sucesso! 🎉' AS status;
