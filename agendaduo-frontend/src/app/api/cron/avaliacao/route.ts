import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES } from '@/lib/supabase';
import axios from 'axios';

const DEFAULT_MSG_AVALIACAO = `Olá, {{nome_paciente}}! 😊

Esperamos que sua consulta tenha sido excelente e agradecemos pela confiança na {{nome_clinica}}.

Sua opinião é muito importante para nós! Se puder, reserve um minutinho para avaliar nosso atendimento:

⭐ Avalie nossa clínica:
{{link_avaliacao_google}}

E para acompanhar novidades, dicas de saúde e conteúdos exclusivos, siga nosso Instagram:

📲 Instagram:
{{link_instagram}}

Obrigado por fazer parte da nossa história. Esperamos revê-lo em breve! 💙`;

// GET /api/cron/avaliacao
export async function GET(req: NextRequest) {
  // Opcional: Proteção de cron do Vercel
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const db = getSupabase();
    
    // 1. Buscar clínicas com lembrete de avaliação ativo
    const { data: clinicas, error: clinicasErr } = await db
      .from(TABLES.clinicas)
      .select('id, nome, lembrete_avaliacao_ativo, lembrete_avaliacao_valor, lembrete_avaliacao_unidade, link_avaliacao_google, link_instagram, msg_avaliacao')
      .eq('lembrete_avaliacao_ativo', true);

    if (clinicasErr || !clinicas?.length) {
      return NextResponse.json({ message: 'Sem clínicas com lembretes de avaliação ativos' });
    }

    const processed = [];
    const now = new Date();

    for (const clinica of clinicas) {
      // Calcular o delay em minutos
      let delayMinutos = clinica.lembrete_avaliacao_valor || 60;
      if (clinica.lembrete_avaliacao_unidade === 'horas') {
        delayMinutos = delayMinutos * 60;
      }

      // Tempo limite do fim da consulta (now - delayMinutos)
      const targetTime = new Date(now.getTime() - delayMinutos * 60 * 1000);
      // Para evitar pegar consultas excessivamente antigas, estabelecemos um limite de 24h atrás
      const limitTime = new Date(targetTime.getTime() - 24 * 3600 * 1000);

      // 2. Buscar consultas atendidas/confirmadas na janela de tempo que ainda não enviaram avaliação
      const { data: consultas, error: consErr } = await db
        .from(TABLES.consultas)
        .select(`*, paciente:${TABLES.pacientes}(nome,telefone), profissional:${TABLES.profissionais}(nome,bio), servico:${TABLES.servicos}(nome)`)
        .eq('clinica_id', clinica.id)
        .in('status', ['confirmado', 'realizado'])
        .eq('avaliacao_enviada', false)
        .gte('data_hora_fim', limitTime.toISOString())
        .lte('data_hora_fim', targetTime.toISOString());

      if (consErr || !consultas?.length) continue;

      for (const consulta of consultas) {
        try {
          // Obter nome e hash da instância WhatsApp do profissional
          let instName = null;
          let instHash = null;
          if (consulta.profissional?.bio) {
            try {
              const bio = JSON.parse(consulta.profissional.bio);
              instName = bio.whatsappInstanceName || null;
              instHash = bio.whatsappInstanceHash || null;
            } catch {}
          }

          // Montar o template
          const template = clinica.msg_avaliacao || DEFAULT_MSG_AVALIACAO;
          let msg = template
            .replace(/{{nome_paciente}}/g, consulta.paciente?.nome || '')
            .replace(/{{nome_clinica}}/g, clinica.nome || '')
            .replace(/{{link_avaliacao_google}}/g, clinica.link_avaliacao_google || '')
            .replace(/{{link_instagram}}/g, clinica.link_instagram || '');

          // Enviar Webhook
          const webhookUrl = 'https://criadordigital-n8n-webhook.5rqumh.easypanel.host/webhook/mensagem-avaliacao-pos';
          
          await axios.post(webhookUrl, {
            mensagem: msg,
            telefone_paciente: consulta.paciente?.telefone || '',
            nome_paciente: consulta.paciente?.nome || '',
            nome_clinica: clinica.nome || '',
            instancia_whatsapp: instName,
            hash_whatsapp: instHash
          });

          // Marcar como enviado no banco de dados
          await db
            .from(TABLES.consultas)
            .update({ avaliacao_enviada: true })
            .eq('id', consulta.id);

          processed.push({ consultaId: consulta.id, status: 'enviado' });
        } catch (errPost: any) {
          console.error(`Erro ao disparar webhook para consulta ${consulta.id}:`, errPost.message);
          processed.push({ consultaId: consulta.id, status: 'erro', error: errPost.message });
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
