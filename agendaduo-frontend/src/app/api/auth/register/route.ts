import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES } from '@/lib/supabase';

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

// POST /api/auth/register
export async function POST(req: NextRequest) {
  try {
    const { email, senha } = await req.json();
    if (!email || !senha) return err('Email e senha são obrigatórios');

    const db = getSupabase();

    const { data: authData, error: authError } = await db.auth.signUp({ email, password: senha });
    if (authError) return err(authError.message);

    const { data: clinica, error: clinicaError } = await db
      .from(TABLES.clinicas as any)
      .insert({
        nome: 'Nova Clínica',
        n8n_webhook_url: process.env.DEFAULT_N8N_WEBHOOK_URL || null,
        evolution_api_url: process.env.DEFAULT_EVOLUTION_API_URL || null,
        evolution_api_key: process.env.DEFAULT_EVOLUTION_API_KEY || null,
      })
      .select('*')
      .single();

    if (clinicaError || !clinica) return err('Erro ao criar clínica: ' + clinicaError?.message);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const bioPayload = JSON.stringify({
      role: 'admin',
      adminEmail: email,
      trialEndsAt: trialEndsAt.toISOString(),
      onboardingCompleted: false,
      isOwner: true,
      inviteStatus: 'aceito',
    });

    const { data: prof } = await db
      .from(TABLES.profissionais as any)
      .insert({ clinica_id: (clinica as any).id, nome: 'Administrador', especialidade: '-', bio: bioPayload, ativo: true })
      .select('*')
      .single();

    return NextResponse.json({
      message: 'Registro concluído',
      clinicaId: clinica.id,
      profissionalId: prof?.id,
      role: 'admin',
      nome: 'Administrador',
      trialEndsAt,
    });
  } catch (e: any) {
    return err(e.message, 500);
  }
}
