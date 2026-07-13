require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function seed() {
  const clinicaId = '00000000-0000-0000-0000-000000000000';
  
  console.log('Inserindo Clínica Demo...');
  const { data, error } = await supabase
    .from('sistema_clinicas_agenciaduo_clinicas')
    .upsert({
      id: clinicaId,
      nome: 'Clínica Demo',
      fuso_horario: 'America/Sao_Paulo',
      financeiro_ativo: false
    })
    .select();

  if (error) {
    console.error('Erro ao inserir:', error.message);
  } else {
    console.log('Inserido com sucesso!', data);
  }
}

seed();
