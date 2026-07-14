import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES } from '@/lib/supabase';
import axios from 'axios';

// GET /api/cron/aniversarios
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const db = getSupabase();
    const now = new Date();
    const brTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const hh = String(brTime.getHours()).padStart(2, '0');
    const mm = String(brTime.getMinutes()).padStart(2, '0');
    const currentHourMin = `${hh}:${mm}`;
    const todayMMDD = String(brTime.getMonth() + 1).padStart(2, '0') + '-' + String(brTime.getDate()).padStart(2, '0');

    const { data: clinicas } = await db
      .from(TABLES.clinicas)
      .select('id, nome, lembrete_aniversario_horario, msg_aniversario')
      .eq('lembrete_aniversario_ativo', true)
      .eq('lembrete_aniversario_horario', currentHourMin);

    if (!clinicas || clinicas.length === 0) {
      return NextResponse.json({ message: 'Nenhuma clínica com lembrete de aniversário ativo agora' });
    }

    const processed = [];
    const DEFAULT_MSG_ANIVERSARIO = `🎉 Feliz aniversário, {{nome_paciente}}!

Toda a equipe da {{nome_clinica}} deseja que o seu dia seja repleto de alegria, saúde e muitos momentos especiais.

Obrigado por confiar em nosso trabalho. Esperamos continuar cuidando de você sempre que precisar.

Parabéns e muitas felicidades! 🎂💙`;

    for (const clinica of clinicas) {
      // Obter pacientes com data_nascimento
      const { data: pacientes } = await db
        .from(TABLES.pacientes)
        .select('id, nome, telefone, data_nascimento')
        .eq('clinica_id', clinica.id)
        .not('data_nascimento', 'is', null);

      const aniversariantes = (pacientes || []).filter((p: any) => {
        if (!p.data_nascimento) return false;
        return p.data_nascimento.substring(5, 10) === todayMMDD;
      });

      if (aniversariantes.length === 0) continue;

      const { data: profissionais } = await db
        .from(TABLES.profissionais)
        .select('bio')
        .eq('clinica_id', clinica.id);

      let instName = null;
      if (profissionais && profissionais.length > 0) {
        for (const p of profissionais) {
          if (p.bio) {
            try {
              const bio = JSON.parse(p.bio);
              if (bio.whatsappInstanceName) {
                instName = bio.whatsappInstanceName;
                break;
              }
            } catch(e) {}
          }
        }
      }

      for (const paciente of aniversariantes) {
        try {
          const template = clinica.msg_aniversario || DEFAULT_MSG_ANIVERSARIO;
          const variables: Record<string, string> = {
            nome_paciente: paciente.nome || '',
            nome_clinica: clinica.nome || '',
          };

          let compiledMsg = template;
          for (const [key, val] of Object.entries(variables)) {
            compiledMsg = compiledMsg.replaceAll(`{{${key}}}`, val);
          }

          const payload = {
            evento: 'lembrete_aniversario',
            clinica_id: clinica.id,
            clinica_nome: clinica.nome,
            paciente_nome: paciente.nome,
            paciente_telefone: paciente.telefone,
            instancia_whatsapp: instName,
            data_aniversario: paciente.data_nascimento,
            mensagem: compiledMsg,
          };

          const webhookUrl = process.env.DEFAULT_N8N_WEBHOOK_ANIVERSARIO_URL || 'https://criadordigital-n8n-webhook.5rqumh.easypanel.host/webhook/lembretes-aniversario-clinicas';
          await axios.post(webhookUrl, payload);
          processed.push({ name: paciente.nome, status: 'enviado' });
        } catch (error: any) {
          processed.push({ name: paciente.nome, status: 'falhou', error: error.message });
        }
      }
    }

    return NextResponse.json({ success: true, processed });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
