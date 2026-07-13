import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES, toCamelCase } from '@/lib/supabase';

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

// GET /api/profissionais/convite-info/[id]
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const db = getSupabase();
    const { data, error } = await db.from(TABLES.profissionais).select('*').eq('id', params.id).single();
    if (error || !data) return err('Profissional ou convite não encontrado', 404);
    return NextResponse.json(toCamelCase(data));
  } catch (e: any) { return err(e.message, 500); }
}
