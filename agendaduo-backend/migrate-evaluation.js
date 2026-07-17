require('dotenv').config();
const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL.replace('.co:', '.net:'),
  });
  await client.connect();
  try {
    const query = `
      ALTER TABLE public.sistema_clinicas_agenciaduo_clinicas
      ADD COLUMN IF NOT EXISTS lembrete_avaliacao_ativo BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS lembrete_avaliacao_valor INT NOT NULL DEFAULT 60,
      ADD COLUMN IF NOT EXISTS lembrete_avaliacao_unidade TEXT NOT NULL DEFAULT 'minutos',
      ADD COLUMN IF NOT EXISTS link_avaliacao_google TEXT,
      ADD COLUMN IF NOT EXISTS link_instagram TEXT,
      ADD COLUMN IF NOT EXISTS msg_avaliacao TEXT;

      ALTER TABLE public.sistema_clinicas_agenciaduo_consultas
      ADD COLUMN IF NOT EXISTS avaliacao_enviada BOOLEAN NOT NULL DEFAULT FALSE;
    `;
    await client.query(query);
    console.log('✅ Evaluation columns added successfully');
  } catch (err) {
    console.error('⚠️ Error adding columns', err);
  } finally {
    await client.end();
  }
}
run();
