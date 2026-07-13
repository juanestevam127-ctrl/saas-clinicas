const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Jn30UlIl90%40%233@db.arxaqnwuyesmjcsyfmbj.supabase.co:5432/postgres?sslmode=require'
});

async function run() {
  await client.connect();
  console.log('Conectado ao banco!');

  try {
    // Adiciona tipo_atendimento na tabela de consultas
    await client.query(`
      ALTER TABLE sistema_clinicas_agenciaduo_consultas 
      ADD COLUMN IF NOT EXISTS tipo_atendimento TEXT DEFAULT 'presencial'
    `);
    console.log('✅ Coluna tipo_atendimento adicionada em consultas');
  } catch (e) {
    console.log('❌ tipo_atendimento:', e.message);
  }

  try {
    // Garante que clinicas tem coluna de endereço
    await client.query(`
      ALTER TABLE sistema_clinicas_agenciaduo_clinicas 
      ADD COLUMN IF NOT EXISTS endereco TEXT
    `);
    console.log('✅ Coluna endereco confirmada em clinicas');
  } catch (e) {
    console.log('ℹ️  endereco:', e.message);
  }

  try {
    // Garante que lembretes_config tem todas as colunas necessárias
    await client.query(`
      ALTER TABLE sistema_clinicas_agenciaduo_lembretes_config 
      ADD COLUMN IF NOT EXISTS webhook_url TEXT,
      ADD COLUMN IF NOT EXISTS minutos_antecedencia INTEGER
    `);
    console.log('✅ Colunas webhook_url e minutos_antecedencia adicionadas em lembretes_config');
  } catch (e) {
    console.log('ℹ️  lembretes_config colunas:', e.message);
  }

  // Remove linha de teste que foi inserida
  try {
    await client.query(`DELETE FROM sistema_clinicas_agenciaduo_lembretes_config WHERE antecedencia = '24h'`);
    console.log('✅ Linha de teste removida de lembretes_config');
  } catch(e) {}

  await client.end();
  console.log('Migração concluída!');
}

run().catch(e => { console.error(e); process.exit(1); });
