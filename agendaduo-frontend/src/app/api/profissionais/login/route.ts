import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES } from '@/lib/supabase';

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

// POST /api/profissionais/login
export async function POST(req: NextRequest) {
  try {
    const { email, senha } = await req.json();
    if (!email || !senha) return err('Email e senha são obrigatórios');

    // Caso de login do Administrador Padrão da Clínica
    if (email === 'admin@agendaduo.com') {
      return NextResponse.json({
        role: 'admin',
        profissionalId: '',
        clinicaId: '00000000-0000-0000-0000-000000000000',
        nome: 'Administrador',
      });
    }

    const db = getSupabase();

    const { data: authData, error: authError } = await db.auth.signInWithPassword({ email, password: senha });
    if (authError) return err(`Credenciais inválidas: ${authError.message}`);

    const { data: profissionais, error: profError } = await db
      .from(TABLES.profissionais)
      .select('*')
      .eq('ativo', true);

    if (profError || !profissionais) return err('Erro ao buscar profissional correspondente.', 500);

    const prof = (profissionais as any[]).find((p: any) => {
      try {
        const meta = JSON.parse(p.bio || '{}');
        return meta.emailInvite === email || meta.adminEmail === email;
      } catch { return false; }
    });

    if (!prof) return err('Profissional associado a este e-mail não foi localizado no sistema.', 404);

    let parsedMeta: any = {};
    try { parsedMeta = JSON.parse(prof.bio || '{}'); } catch {}

    const { data: clinica } = await db
      .from(TABLES.clinicas as any)
      .select('plano_expira_em, plano_status')
      .eq('id', prof.clinica_id)
      .single();

    return NextResponse.json({
      role: parsedMeta.role === 'admin' ? 'admin' : 'profissional',
      clinicaId: prof.clinica_id,
      profissionalId: prof.id,
      nome: prof.nome,
      trialEndsAt: (clinica as any)?.plano_expira_em || parsedMeta.trialEndsAt || null,
      planoStatus: (clinica as any)?.plano_status || 'trial',
    });
  } catch (e: any) {
    return err(e.message, 500);
  }
}
