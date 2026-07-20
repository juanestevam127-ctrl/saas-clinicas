import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES, toSnakeCase, toCamelCase } from '@/lib/supabase';

function clinicaId(req: NextRequest): string {
  return req.headers.get('x-clinica-id') || '';
}

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

// GET /api/prontuarios/evolucoes?pacienteId=X
export async function GET(req: NextRequest) {
  try {
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);

    const { searchParams } = new URL(req.url);
    const pacienteId = searchParams.get('pacienteId');
    if (!pacienteId) return err('pacienteId obrigatório', 400);

    const db = getSupabase();
    
    // Buscar as evoluções clínicas juntando com o nome do profissional
    const { data, error } = await db
      .from(TABLES.prontuariosEvolucoes)
      .select(`*, profissional:${TABLES.profissionais}(nome)`)
      .eq('clinica_id', cid)
      .eq('paciente_id', pacienteId)
      .order('data_hora', { ascending: false });

    if (error) return err(error.message, 500);

    return NextResponse.json(toCamelCase(data ?? []));
  } catch (e: any) {
    return err(e.message, 500);
  }
}

// POST /api/prontuarios/evolucoes
export async function POST(req: NextRequest) {
  try {
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);

    const body = await req.json();
    const { pacienteId, profissionalId, texto, dataHora } = body;

    if (!pacienteId || !profissionalId || !texto) {
      return err('Campos pacienteId, profissionalId e texto são obrigatórios', 400);
    }

    const payload = toSnakeCase({
      clinicaId: cid,
      pacienteId,
      profissionalId,
      texto,
      dataHora: dataHora || new Date().toISOString()
    });

    const db = getSupabase();
    const { data, error } = await db
      .from(TABLES.prontuariosEvolucoes)
      .insert(payload)
      .select(`*, profissional:${TABLES.profissionais}(nome)`)
      .single();

    if (error) return err(error.message, 500);

    return NextResponse.json(toCamelCase(data), { status: 201 });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

// DELETE /api/prontuarios/evolucoes?id=X
export async function DELETE(req: NextRequest) {
  try {
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return err('id obrigatório', 400);

    const db = getSupabase();
    const { error } = await db
      .from(TABLES.prontuariosEvolucoes)
      .delete()
      .eq('id', id)
      .eq('clinica_id', cid);

    if (error) return err(error.message, 500);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return err(e.message, 500);
  }
}
