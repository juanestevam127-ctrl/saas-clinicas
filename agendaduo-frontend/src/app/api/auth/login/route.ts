import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES } from '@/lib/supabase';

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

// POST /api/auth/login
export async function POST(req: NextRequest) {
  try {
    const { email, senha } = await req.json();
    if (!email || !senha) return err('Email e senha são obrigatórios');

    const db = getSupabase();

    const { data: authData, error: authError } = await db.auth.signInWithPassword({ email, password: senha });
    if (authError) return err(`Credenciais inválidas: ${authError.message}`);

    const { data: profissionais } = await db
      .from(TABLES.profissionais)
      .select('*')
      .eq('ativo', true);

    const prof = ((profissionais || []) as any[]).find((p: any) => {
      try {
        const meta = JSON.parse(p.bio || '{}');
        return meta.emailInvite === email || meta.adminEmail === email;
      } catch { return false; }
    });

    if (!prof) return err('Profissional associado a este e-mail não foi localizado.', 404);

    let parsedMeta: any = {};
    try { parsedMeta = JSON.parse(prof.bio || '{}'); } catch {}

    return NextResponse.json({
      role: parsedMeta.role === 'admin' ? 'admin' : 'profissional',
      clinicaId: prof.clinica_id,
      profissionalId: prof.id,
      nome: prof.nome,
      trialEndsAt: parsedMeta.trialEndsAt || null,
    });
  } catch (e: any) {
    return err(e.message, 500);
  }
}
