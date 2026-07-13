import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES, toSnakeCase, toCamelCase } from '@/lib/supabase';

function clinicaId(req: NextRequest): string {
  return req.headers.get('x-clinica-id') || '';
}

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

// GET /api/financeiro
export async function GET(req: NextRequest) {
  try {
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    const db = getSupabase();
    const { data, error } = await db
      .from(TABLES.financeiro)
      .select('*, paciente:sistema_clinicas_agenciaduo_pacientes(id,nome), profissional:sistema_clinicas_agenciaduo_profissionais(id,nome), consulta:sistema_clinicas_agenciaduo_consultas(id,data_hora_inicio)')
      .eq('clinica_id', cid)
      .order('created_at', { ascending: false });

    if (error) return err(error.message, 500);
    return NextResponse.json(toCamelCase(data ?? []));
  } catch (e: any) { return err(e.message, 500); }
}

// POST /api/financeiro
export async function POST(req: NextRequest) {
  try {
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    const body = await req.json();
    const payload = toSnakeCase({ ...body, clinicaId: cid });
    const db = getSupabase();
    const { data, error } = await db.from(TABLES.financeiro).insert(payload).select().single();
    if (error) return err(error.message, 500);
    return NextResponse.json(toCamelCase(data), { status: 201 });
  } catch (e: any) { return err(e.message, 500); }
}
