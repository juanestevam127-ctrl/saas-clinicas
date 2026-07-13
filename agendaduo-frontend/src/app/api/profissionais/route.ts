import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES, toSnakeCase, toCamelCase } from '@/lib/supabase';

function clinicaId(req: NextRequest): string {
  return req.headers.get('x-clinica-id') || '';
}

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

// GET /api/profissionais
export async function GET(req: NextRequest) {
  try {
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    const db = getSupabase();
    const { data, error } = await db.from(TABLES.profissionais).select('*').eq('clinica_id', cid).order('nome', { ascending: true });
    if (error) return err(error.message, 500);
    return NextResponse.json(toCamelCase(data ?? []));
  } catch (e: any) { return err(e.message, 500); }
}

// POST /api/profissionais
export async function POST(req: NextRequest) {
  try {
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    const body = await req.json();
    const payload = toSnakeCase({ ...body, clinicaId: cid });
    const db = getSupabase();
    const { data, error } = await db.from(TABLES.profissionais).insert(payload).select().single();
    if (error) return err(error.message, 500);
    return NextResponse.json(toCamelCase(data), { status: 201 });
  } catch (e: any) { return err(e.message, 500); }
}
