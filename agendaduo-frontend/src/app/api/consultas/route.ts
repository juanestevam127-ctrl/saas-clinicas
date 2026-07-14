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

// GET /api/consultas
export async function GET(req: NextRequest) {
  try {
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    const db = getSupabase();
    const { data, error } = await db
      .from(TABLES.consultas)
      .select('*, paciente:sistema_clinicas_agenciaduo_pacientes(id,nome), profissional:sistema_clinicas_agenciaduo_profissionais(id,nome), servico:sistema_clinicas_agenciaduo_servicos(id,nome,valor_padrao)')
      .eq('clinica_id', cid)
      .order('data_hora_inicio', { ascending: true });
    if (error) return err(error.message, 500);
    return NextResponse.json(toCamelCase(data ?? []));
  } catch (e: any) { return err(e.message, 500); }
}

// POST /api/consultas
export async function POST(req: NextRequest) {
  try {
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    const body = await req.json();

    const inicio = new Date(body.dataHoraInicio);
    const fim = new Date(body.dataHoraFim);
    if (inicio >= fim) return err('Início deve ser anterior ao fim.');

    const db = getSupabase();
    try {
      await checkHorariosFuncionamento(db, cid, inicio, fim);
      await checkConflict(db, body.profissionalId, inicio, fim);
    } catch (e: any) {
      return err(e.message);
    }

    const payload = toSnakeCase({
      clinicaId: cid,
      createdBy: 'system',
      pacienteId: body.pacienteId,
      profissionalId: body.profissionalId,
      servicoId: body.servicoId,
      dataHoraInicio: body.dataHoraInicio,
      dataHoraFim: body.dataHoraFim,
      status: body.status ?? 'agendado',
      tipoAtendimento: body.tipoAtendimento || 'presencial',
      observacoes: body.observacoes,
      valorCobrado: body.valorCobrado,
      formaPagamento: body.formaPagamento || 'PIX',
    });

    const { data: result, error } = await db
      .from(TABLES.consultas)
      .insert(payload)
      .select('*, paciente:sistema_clinicas_agenciaduo_pacientes(id,nome), profissional:sistema_clinicas_agenciaduo_profissionais(id,nome), servico:sistema_clinicas_agenciaduo_servicos(id,nome,valor_padrao)')
      .single();

    if (error) return err(error.message, 500);

    // Sincronizar com o Google Calendar em segundo plano
    try {
      const { syncEventToGoogle } = await import('@/lib/google-calendar');
      syncEventToGoogle(result.id).catch(console.error);
    } catch (errSync) {
      console.error('Falha ao carregar utilitários do Google:', errSync);
    }

    return NextResponse.json(toCamelCase(result), { status: 201 });
  } catch (e: any) { return err(e.message, 500); }
}
