require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
async function run() {
  const query = `
    ALTER TABLE public.sistema_clinicas_agenciaduo_clinicas
    ADD COLUMN IF NOT EXISTS lembrete_aniversario_ativo boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS lembrete_aniversario_horario text DEFAULT '08:00',
    ADD COLUMN IF NOT EXISTS n8n_webhook_aniversario_url text;
  `;
  const { error } = await supabase.rpc('exec_sql', { query_string: query });
  console.log('RPC error:', error);
}
run();
