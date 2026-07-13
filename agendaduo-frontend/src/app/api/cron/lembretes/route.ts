import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES } from '@/lib/supabase';
import axios from 'axios';

// GET /api/cron/lembretes
export async function GET(req: NextRequest) {
  // Opcional: Proteção de cron do Vercel
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const db = getSupabase();
    // Buscar configurações ativas com dados da clínica
    const { data: configs, error: cfgErr } = await db
      .from(TABLES.lembretesConfig)
      .select(`*, clinica:${TABLES.clinicas}(nome, n8n_webhook_url, endereco)`)
      .eq('ativo', true);

    if (cfgErr || !configs?.length) {
      return NextResponse.json({ message: 'Sem configurações ativas de lembretes' });
    }

    const processed = [];

    for (const config of configs) {
      let hours = 24;
      if (config.antecedencia === '2h') hours = 2;
      if (config.antecedencia === '1h') hours = 1;
      if (config.antecedencia.endsWith('m')) hours = parseInt(config.antecedencia) / 60;
      else if (config.antecedencia.endsWith('h')) hours = parseInt(config.antecedencia);
      else if (config.antecedencia.endsWith('d')) hours = parseInt(config.antecedencia) * 24;

      const targetTime = new Date();
      targetTime.setTime(targetTime.getTime() + hours * 3600 * 1000);
      
      const windowStart = new Date(targetTime.getTime() - 2 * 60000);

      const { data: consultas } = await db
        .from(TABLES.consultas)
        .select(`*, paciente:${TABLES.pacientes}(nome,telefone), profissional:${TABLES.profissionais}(nome,bio), servico:${TABLES.servicos}(nome)`)
        .eq('clinica_id', config.clinica_id)
        .in('status', ['agendado', 'confirmado'])
        .gte('data_hora_inicio', windowStart.toISOString())
        .lte('data_hora_inicio', targetTime.toISOString());

      for (const consulta of (consultas ?? [])) {
        const { data: sent } = await db
          .from(TABLES.lembretesLog)
          .select('id, status')
          .eq('consulta_id', consulta.id)
          .eq('antecedencia', config.antecedencia)
          .single();

        if (sent?.status === 'enviado') continue;

        try {
          let instName = null;
          if (consulta.profissional?.bio) {
            try {
              const bio = JSON.parse(consulta.profissional.bio);
              instName = bio.whatsappInstanceName || null;
            } catch(e){}
          }

          const payload = {
            evento: 'lembrete_consulta',
            clinica_id: config.clinica_id,
            clinica_nome: config.clinica.nome,
            paciente_nome: consulta.paciente?.nome,
            paciente_telefone: consulta.paciente?.telefone,
            profissional_nome: consulta.profissional?.nome,
            instancia_whatsapp: instName,
            servico: consulta.servico?.nome,
            data_hora: consulta.data_hora_inicio,
            antecedencia: config.antecedencia,
            tipo_atendimento: consulta.tipo_atendimento || 'presencial',
            endereco_clinica: (!consulta.tipo_atendimento || consulta.tipo_atendimento === 'presencial') ? config.clinica.endereco : null,
          };

          const webhookUrl = 'https://criadordigital-n8n-webhook.5rqumh.easypanel.host/webhook/lembretes-clinicas';
          await axios.post(webhookUrl, payload);

          await db.from(TABLES.lembretesLog).insert({
            consulta_id: consulta.id,
            antecedencia: config.antecedencia,
            status: 'enviado',
          });

          processed.push({ id: consulta.id, status: 'enviado' });
        } catch (error: any) {
          await db.from(TABLES.lembretesLog).insert({
            consulta_id: consulta.id,
            antecedencia: config.antecedencia,
            status: 'falhou',
          });
          processed.push({ id: consulta.id, status: 'falhou', error: error.message });
        }
      }
    }

    return NextResponse.json({ success: true, processed });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
