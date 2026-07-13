require('dotenv').config();
const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  try {
    const query = `
      ALTER TABLE public.sistema_clinicas_agenciaduo_clinicas
      ADD COLUMN IF NOT EXISTS lembrete_aniversario_ativo boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS lembrete_aniversario_horario text DEFAULT '08:00',
      ADD COLUMN IF NOT EXISTS n8n_webhook_aniversario_url text;
    `;
    await client.query(query);
    console.log('Columns added successfully');
  } catch (err) {
    console.error('Error adding columns', err);
  } finally {
    await client.end();
  }
}
run();
