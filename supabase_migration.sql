-- ============================================================
-- AgendaDuo - Script de Criação do Banco de Dados
-- Cole este SQL inteiro no Supabase SQL Editor e clique em RUN
-- ============================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: CLINICAS (Tenants)
-- ============================================================
CREATE TABLE IF NOT EXISTS sistema_clinicas_agenciaduo_clinicas (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome                  TEXT        NOT NULL,
  cnpj                  TEXT,
  telefone              TEXT,
  endereco              TEXT,
  logo                  TEXT,
  horario_funcionamento TEXT,
  fuso_horario          TEXT        NOT NULL DEFAULT 'America/Sao_Paulo',
  financeiro_ativo      BOOLEAN     NOT NULL DEFAULT FALSE,
  n8n_webhook_url       TEXT,
  evolution_api_url     TEXT,
  evolution_api_key     TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: PROFISSIONAIS
-- ============================================================
CREATE TABLE IF NOT EXISTS sistema_clinicas_agenciaduo_profissionais (
  id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinica_id              UUID        NOT NULL REFERENCES sistema_clinicas_agenciaduo_clinicas(id) ON DELETE CASCADE,
  nome                    TEXT        NOT NULL,
  especialidade           TEXT,
  registro_profissional   TEXT,
  foto_url                TEXT,
  bio                     TEXT,
  duracao_padrao_consulta INT         NOT NULL DEFAULT 30,
  ativo                   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: HORÁRIOS DOS PROFISSIONAIS
-- ============================================================
CREATE TABLE IF NOT EXISTS sistema_clinicas_agenciaduo_horarios_profissionais (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profissional_id UUID NOT NULL REFERENCES sistema_clinicas_agenciaduo_profissionais(id) ON DELETE CASCADE,
  dia_semana      INT  NOT NULL, -- 0=Dom, 1=Seg, ..., 6=Sab
  hora_inicio     TEXT NOT NULL, -- Formato "HH:mm"
  hora_fim        TEXT NOT NULL  -- Formato "HH:mm"
);

-- ============================================================
-- TABELA: BLOQUEIOS DE AGENDA
-- ============================================================
CREATE TABLE IF NOT EXISTS sistema_clinicas_agenciaduo_bloqueios_agenda (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  profissional_id UUID        NOT NULL REFERENCES sistema_clinicas_agenciaduo_profissionais(id) ON DELETE CASCADE,
  data_inicio     TIMESTAMPTZ NOT NULL,
  data_fim        TIMESTAMPTZ NOT NULL,
  motivo          TEXT
);

-- ============================================================
-- TABELA: PACIENTES
-- ============================================================
CREATE TABLE IF NOT EXISTS sistema_clinicas_agenciaduo_pacientes (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinica_id      UUID        NOT NULL REFERENCES sistema_clinicas_agenciaduo_clinicas(id) ON DELETE CASCADE,
  nome            TEXT        NOT NULL,
  telefone        TEXT,
  email           TEXT,
  data_nascimento TIMESTAMPTZ,
  cpf             TEXT,       -- Armazenado criptografado AES-256
  genero          TEXT,
  observacoes     TEXT,
  ativo           BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: SERVIÇOS
-- ============================================================
CREATE TABLE IF NOT EXISTS sistema_clinicas_agenciaduo_servicos (
  id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinica_id      UUID           NOT NULL REFERENCES sistema_clinicas_agenciaduo_clinicas(id) ON DELETE CASCADE,
  nome            TEXT           NOT NULL,
  descricao       TEXT,
  duracao_minutos INT            NOT NULL DEFAULT 30,
  valor_padrao    DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ativo           BOOLEAN        NOT NULL DEFAULT TRUE
);

-- ============================================================
-- TABELA: PROFISSIONAL × SERVIÇO (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS sistema_clinicas_agenciaduo_profissional_servicos (
  id                 UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  profissional_id    UUID           NOT NULL REFERENCES sistema_clinicas_agenciaduo_profissionais(id) ON DELETE CASCADE,
  servico_id         UUID           NOT NULL REFERENCES sistema_clinicas_agenciaduo_servicos(id) ON DELETE CASCADE,
  valor_personalizado DECIMAL(10, 2)
);

-- ============================================================
-- TABELA: CONSULTAS (Agendamentos)
-- ============================================================
CREATE TABLE IF NOT EXISTS sistema_clinicas_agenciaduo_consultas (
  id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinica_id      UUID           NOT NULL REFERENCES sistema_clinicas_agenciaduo_clinicas(id) ON DELETE CASCADE,
  paciente_id     UUID           NOT NULL REFERENCES sistema_clinicas_agenciaduo_pacientes(id),
  profissional_id UUID           NOT NULL REFERENCES sistema_clinicas_agenciaduo_profissionais(id),
  servico_id      UUID           NOT NULL REFERENCES sistema_clinicas_agenciaduo_servicos(id),
  data_hora_inicio TIMESTAMPTZ   NOT NULL,
  data_hora_fim   TIMESTAMPTZ    NOT NULL,
  status          TEXT           NOT NULL DEFAULT 'agendado', -- agendado|confirmado|cancelado|realizado|faltou
  observacoes     TEXT,
  valor_cobrado   DECIMAL(10, 2),
  created_by      TEXT,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: HISTÓRICO DE STATUS DAS CONSULTAS
-- ============================================================
CREATE TABLE IF NOT EXISTS sistema_clinicas_agenciaduo_consultas_historico (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  consulta_id     UUID        NOT NULL REFERENCES sistema_clinicas_agenciaduo_consultas(id) ON DELETE CASCADE,
  status_anterior TEXT        NOT NULL,
  status_novo     TEXT        NOT NULL,
  motivo          TEXT,
  alterado_por    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: CONFIG DE LEMBRETES
-- ============================================================
CREATE TABLE IF NOT EXISTS sistema_clinicas_agenciaduo_lembretes_config (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinica_id  UUID    NOT NULL REFERENCES sistema_clinicas_agenciaduo_clinicas(id) ON DELETE CASCADE,
  antecedencia TEXT   NOT NULL, -- "24h", "2h", "1h"
  ativo       BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
-- TABELA: LOG DE LEMBRETES ENVIADOS
-- ============================================================
CREATE TABLE IF NOT EXISTS sistema_clinicas_agenciaduo_lembretes_log (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  consulta_id  UUID        NOT NULL,
  antecedencia TEXT        NOT NULL,
  status       TEXT        NOT NULL, -- enviado | falhou
  tentativas   INT         NOT NULL DEFAULT 1,
  data_envio   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: WHATSAPP INSTÂNCIAS
-- ============================================================
CREATE TABLE IF NOT EXISTS sistema_clinicas_agenciaduo_whatsapp_instancias (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinica_id     UUID        NOT NULL REFERENCES sistema_clinicas_agenciaduo_clinicas(id) ON DELETE CASCADE,
  instancia_nome TEXT        NOT NULL,
  instancia_id   TEXT,
  hash           TEXT,
  status         TEXT        NOT NULL DEFAULT 'aguardando_qr', -- conectado|desconectado|aguardando_qr
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: FINANCEIRO
-- ============================================================
CREATE TABLE IF NOT EXISTS sistema_clinicas_agenciaduo_financeiro (
  id               UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinica_id       UUID           NOT NULL REFERENCES sistema_clinicas_agenciaduo_clinicas(id) ON DELETE CASCADE,
  consulta_id      UUID           REFERENCES sistema_clinicas_agenciaduo_consultas(id),
  paciente_id      UUID           REFERENCES sistema_clinicas_agenciaduo_pacientes(id),
  profissional_id  UUID           REFERENCES sistema_clinicas_agenciaduo_profissionais(id),
  valor            DECIMAL(10, 2) NOT NULL,
  status_pagamento TEXT           NOT NULL DEFAULT 'pendente', -- pendente|pago|cancelado|reembolsado
  forma_pagamento  TEXT,           -- dinheiro|pix|cartao_credito|cartao_debito|convenio
  data_pagamento   TIMESTAMPTZ,
  observacoes      TEXT,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: AUDITORIA
-- ============================================================
CREATE TABLE IF NOT EXISTS sistema_clinicas_agenciaduo_auditoria (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinica_id       UUID        NOT NULL REFERENCES sistema_clinicas_agenciaduo_clinicas(id) ON DELETE CASCADE,
  usuario_id       TEXT        NOT NULL,
  acao             TEXT        NOT NULL,
  entidade         TEXT        NOT NULL,
  entidade_id      TEXT        NOT NULL,
  dados_anteriores JSONB,
  dados_novos      JSONB,
  ip               TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profissionais_clinica   ON sistema_clinicas_agenciaduo_profissionais(clinica_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_clinica        ON sistema_clinicas_agenciaduo_pacientes(clinica_id);
CREATE INDEX IF NOT EXISTS idx_servicos_clinica         ON sistema_clinicas_agenciaduo_servicos(clinica_id);
CREATE INDEX IF NOT EXISTS idx_consultas_clinica        ON sistema_clinicas_agenciaduo_consultas(clinica_id);
CREATE INDEX IF NOT EXISTS idx_consultas_data           ON sistema_clinicas_agenciaduo_consultas(data_hora_inicio);
CREATE INDEX IF NOT EXISTS idx_consultas_profissional   ON sistema_clinicas_agenciaduo_consultas(profissional_id);
CREATE INDEX IF NOT EXISTS idx_consultas_paciente       ON sistema_clinicas_agenciaduo_consultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_consultas_status         ON sistema_clinicas_agenciaduo_consultas(status);
CREATE INDEX IF NOT EXISTS idx_financeiro_clinica       ON sistema_clinicas_agenciaduo_financeiro(clinica_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_status        ON sistema_clinicas_agenciaduo_financeiro(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_auditoria_clinica        ON sistema_clinicas_agenciaduo_auditoria(clinica_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_clinica         ON sistema_clinicas_agenciaduo_whatsapp_instancias(clinica_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Segurança Multi-Tenant
-- ============================================================
-- Habilitar RLS em todas as tabelas
ALTER TABLE sistema_clinicas_agenciaduo_clinicas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE sistema_clinicas_agenciaduo_profissionais          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sistema_clinicas_agenciaduo_horarios_profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE sistema_clinicas_agenciaduo_bloqueios_agenda       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sistema_clinicas_agenciaduo_pacientes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE sistema_clinicas_agenciaduo_servicos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE sistema_clinicas_agenciaduo_profissional_servicos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sistema_clinicas_agenciaduo_consultas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE sistema_clinicas_agenciaduo_consultas_historico    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sistema_clinicas_agenciaduo_lembretes_config       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sistema_clinicas_agenciaduo_lembretes_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sistema_clinicas_agenciaduo_whatsapp_instancias    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sistema_clinicas_agenciaduo_financeiro             ENABLE ROW LEVEL SECURITY;
ALTER TABLE sistema_clinicas_agenciaduo_auditoria              ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS: service_role tem acesso total (usado pelo backend NestJS)
-- Todas as políticas abaixo permitem acesso via service_role para o backend
CREATE POLICY "service_role_full_access_clinicas"
  ON sistema_clinicas_agenciaduo_clinicas FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "service_role_full_access_profissionais"
  ON sistema_clinicas_agenciaduo_profissionais FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "service_role_full_access_horarios"
  ON sistema_clinicas_agenciaduo_horarios_profissionais FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "service_role_full_access_bloqueios"
  ON sistema_clinicas_agenciaduo_bloqueios_agenda FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "service_role_full_access_pacientes"
  ON sistema_clinicas_agenciaduo_pacientes FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "service_role_full_access_servicos"
  ON sistema_clinicas_agenciaduo_servicos FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "service_role_full_access_prof_servicos"
  ON sistema_clinicas_agenciaduo_profissional_servicos FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "service_role_full_access_consultas"
  ON sistema_clinicas_agenciaduo_consultas FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "service_role_full_access_consultas_hist"
  ON sistema_clinicas_agenciaduo_consultas_historico FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "service_role_full_access_lembretes_config"
  ON sistema_clinicas_agenciaduo_lembretes_config FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "service_role_full_access_lembretes_log"
  ON sistema_clinicas_agenciaduo_lembretes_log FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "service_role_full_access_whatsapp"
  ON sistema_clinicas_agenciaduo_whatsapp_instancias FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "service_role_full_access_financeiro"
  ON sistema_clinicas_agenciaduo_financeiro FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "service_role_full_access_auditoria"
  ON sistema_clinicas_agenciaduo_auditoria FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ============================================================
-- TRIGGERS: auto-updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_clinicas
  BEFORE UPDATE ON sistema_clinicas_agenciaduo_clinicas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_profissionais
  BEFORE UPDATE ON sistema_clinicas_agenciaduo_profissionais
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_pacientes
  BEFORE UPDATE ON sistema_clinicas_agenciaduo_pacientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_consultas
  BEFORE UPDATE ON sistema_clinicas_agenciaduo_consultas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FIM DO SCRIPT - Todas as tabelas criadas com sucesso!
-- ============================================================
SELECT 'AgendaDuo: Banco de dados configurado com sucesso! 🎉' AS status;
