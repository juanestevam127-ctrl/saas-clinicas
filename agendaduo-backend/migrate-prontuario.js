require('dotenv').config();
const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL.replace('.co:', '.net:'),
  });
  await client.connect();
  try {
    const query = `
      -- Table for evolution notes / annotations
      CREATE TABLE IF NOT EXISTS public.sistema_clinicas_agenciaduo_prontuarios_evolucoes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clinica_id UUID NOT NULL,
        paciente_id UUID NOT NULL,
        profissional_id UUID NOT NULL,
        texto TEXT NOT NULL,
        data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Table for uploaded files and photos metadata
      CREATE TABLE IF NOT EXISTS public.sistema_clinicas_agenciaduo_prontuarios_arquivos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clinica_id UUID NOT NULL,
        paciente_id UUID NOT NULL,
        nome_arquivo TEXT NOT NULL,
        url_arquivo TEXT NOT NULL,
        tipo_arquivo TEXT NOT NULL, -- 'foto' or 'pdf'
        tamanho_bytes INT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    await client.query(query);
    console.log('✅ Prontuario tables created successfully');
  } catch (err) {
    console.error('⚠️ Error executing migration', err);
  } finally {
    await client.end();
  }
}
run();
