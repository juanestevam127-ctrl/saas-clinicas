import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES, toSnakeCase, toCamelCase } from '@/lib/supabase';

function clinicaId(req: NextRequest): string {
  return req.headers.get('x-clinica-id') || '';
}

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

// GET /api/servicos/[id]
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    const db = getSupabase();
    const { data, error } = await db.from(TABLES.servicos).select('*').eq('id', params.id).eq('clinica_id', cid).single();
    if (error || !data) return err('Serviço não encontrado', 404);
    return NextResponse.json(toCamelCase(data));
  } catch (e: any) { return err(e.message, 500); }
}

// PATCH /api/servicos/[id]
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    const body = await req.json();
    const db = getSupabase();
    const { data: exist } = await db.from(TABLES.servicos).select('id').eq('id', params.id).eq('clinica_id', cid).single();
    if (!exist) return err('Serviço não encontrado', 404);

    const payload = toSnakeCase(body);
    const { data, error } = await db.from(TABLES.servicos).update(payload).eq('id', params.id).eq('clinica_id', cid).select().single();
    if (error) return err(error.message, 500);
    return NextResponse.json(toCamelCase(data));
  } catch (e: any) { return err(e.message, 500); }
}

// DELETE /api/servicos/[id]
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    const db = getSupabase();
    const { data, error } = await db.from(TABLES.servicos).delete().eq('id', params.id).eq('clinica_id', cid).select().single();
    if (error) {
      if (error.code === '23503') {
        return err('Não é possível excluir permanentemente este serviço pois existem consultas vinculadas a ele.');
      }
      return err(error.message, 500);
    }
    if (!data) return err('Serviço não encontrado ou já excluído.', 404);
    return NextResponse.json(toCamelCase(data));
  } catch (e: any) { return err(e.message, 500); }
}
