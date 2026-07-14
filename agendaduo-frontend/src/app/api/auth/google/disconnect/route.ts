import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES } from '@/lib/supabase';

// POST /api/auth/google/disconnect
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const profissionalId = searchParams.get('profissionalId');

    if (!profissionalId) {
      return NextResponse.json({ message: 'profissionalId é obrigatório' }, { status: 400 });
    }

    const db = getSupabase();
    const { error } = await db
      .from(TABLES.profissionais as any)
      .update({
        google_access_token: null,
        google_refresh_token: null,
        google_calendar_id: null,
      })
      .eq('id', profissionalId);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Google Agenda desconectada com sucesso.' });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}
