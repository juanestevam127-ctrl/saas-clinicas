import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES, toSnakeCase, toCamelCase } from '@/lib/supabase';

function clinicaId(req: NextRequest): string {
  return req.headers.get('x-clinica-id') || '';
}

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

async function checkConflict(db: any, profissionalId: string, inicio: Date, fim: Date, ignorarId?: string) {
  let query = db
    .from(TABLES.consultas)
    .select('id')
    .eq('profissional_id', profissionalId)
    .in('status', ['agendado', 'confirmado'])
    .lt('data_hora_inicio', fim.toISOString())
    .gt('data_hora_fim', inicio.toISOString());

  if (ignorarId) query = query.neq('id', ignorarId);

  const { data } = await query;
  if (data && data.length > 0) {
    throw new Error('O profissional já possui uma consulta neste horário.');
  }
}

async function checkHorariosFuncionamento(db: any, clinicaId: string, inicio: Date, fim: Date) {
  const { data } = await db
    .from(TABLES.clinicas)
    .select('horario_funcionamento')
    .eq('id', clinicaId)
    .single();

  if (!data || !data.horario_funcionamento) return;

  const spTimeStr = new Date(inicio.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const diaSemana = spTimeStr.getDay(); // 0 a 6
  const hInicio = spTimeStr.getHours().toString().padStart(2, '0') + ':' + spTimeStr.getMinutes().toString().padStart(2, '0');

  const spFimTimeStr = new Date(fim.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const hFim = spFimTimeStr.getHours().toString().padStart(2, '0') + ':' + spFimTimeStr.getMinutes().toString().padStart(2, '0');

  let horariosArray = data.horario_funcionamento;
  if (typeof horariosArray === 'string') {
    try { horariosArray = JSON.parse(horariosArray); } catch (e) {}
  }

  const config = horariosArray[diaSemana];

  if (!config || !config.ativo) {
    throw new Error('A clínica está fechada neste dia da semana.');
  }

  if (hInicio < config.inicio || hFim > config.fim) {
    throw new Error(`O horário do agendamento deve estar dentro do horário de funcionamento (${config.inicio} às ${config.fim}).`);
  }
}

// GET /api/consultas/[id]
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    const db = getSupabase();
    const { data, error } = await db
      .from(TABLES.consultas)
      .select('*, paciente:sistema_clinicas_agenciaduo_pacientes(*), profissional:sistema_clinicas_agenciaduo_profissionais(*), servico:sistema_clinicas_agenciaduo_servicos(*)')
      .eq('id', params.id)
      .eq('clinica_id', cid)
      .single();
    if (error || !data) return err('Consulta não encontrada', 404);
    return NextResponse.json(toCamelCase(data));
  } catch (e: any) { return err(e.message, 500); }
}

// PATCH /api/consultas/[id]
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    const body = await req.json();

    const db = getSupabase();
    const { data: consulta, error: loadError } = await db
      .from(TABLES.consultas)
      .select('*')
      .eq('id', params.id)
      .eq('clinica_id', cid)
      .single();

    if (loadError || !consulta) return err('Consulta não encontrada', 404);

    const payload: any = {};
    if (body.pacienteId) payload.pacienteId = body.pacienteId;
    if (body.profissionalId) payload.profissionalId = body.profissionalId;
    if (body.servicoId) payload.servicoId = body.servicoId;
    if (body.dataHoraInicio) payload.dataHoraInicio = body.dataHoraInicio;
    if (body.dataHoraFim) payload.dataHoraFim = body.dataHoraFim;
    if (body.status) payload.status = body.status;
    if (body.observacoes !== undefined) payload.observacoes = body.observacoes;
    if (body.valorCobrado !== undefined) payload.valorCobrado = body.valorCobrado;
    if (body.formaPagamento !== undefined) payload.formaPagamento = body.formaPagamento;

    if (body.dataHoraInicio || body.dataHoraFim) {
      const inicio = new Date(body.dataHoraInicio ?? consulta.data_hora_inicio);
      const fim = new Date(body.dataHoraFim ?? consulta.data_hora_fim);
      try {
        await checkHorariosFuncionamento(db, cid, inicio, fim);
        await checkConflict(db, body.profissionalId ?? consulta.profissional_id, inicio, fim, params.id);
      } catch (e: any) {
        return err(e.message);
      }
    }

    const dbPayload = toSnakeCase(payload);
    const { data, error } = await db
      .from(TABLES.consultas)
      .update(dbPayload)
      .eq('id', params.id)
      .eq('clinica_id', cid)
      .select()
      .single();

    if (error) return err(error.message, 500);

    // Sincronizar com o Google Calendar em segundo plano
    try {
      const { syncEventToGoogle } = await import('@/lib/google-calendar');
      syncEventToGoogle(data.id).catch(console.error);
    } catch (errSync) {
      console.error('Falha ao carregar utilitários do Google:', errSync);
    }

    return NextResponse.json(toCamelCase(data));
  } catch (e: any) { return err(e.message, 500); }
}

// DELETE /api/consultas/[id]
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    const db = getSupabase();

    // Deleta os históricos vinculados primeiro
    await db.from(TABLES.consultaHistorico).delete().eq('consulta_id', params.id);
    // Deleta os logs de lembretes vinculados
    await db.from(TABLES.lembretesLog).delete().eq('consulta_id', params.id);
    // Deleta qualquer lançamento financeiro vinculado à consulta
    await db.from(TABLES.financeiro).delete().eq('consulta_id', params.id);

    const { data, error } = await db
      .from(TABLES.consultas)
      .delete()
      .eq('id', params.id)
      .eq('clinica_id', cid)
      .select()
      .single();

    if (error) return err(error.message, 500);
    if (!data) return err('Consulta não encontrada ou já excluída.', 404);

    // Remover do Google Calendar em segundo plano
    if (data.google_event_id) {
      try {
        const { deleteEventFromGoogle } = await import('@/lib/google-calendar');
        deleteEventFromGoogle(data.profissional_id, data.google_event_id).catch(console.error);
      } catch (errSync) {
        console.error('Falha ao carregar utilitários do Google:', errSync);
      }
    }

    return NextResponse.json(toCamelCase(data));
  } catch (e: any) { return err(e.message, 500); }
}
