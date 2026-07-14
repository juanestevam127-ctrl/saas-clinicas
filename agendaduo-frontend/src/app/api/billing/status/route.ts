import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES, toCamelCase } from '@/lib/supabase';

function clinicaId(req: NextRequest): string {
  return req.headers.get('x-clinica-id') || '';
}

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

// GET /api/billing/status
export async function GET(req: NextRequest) {
  try {
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    const db = getSupabase();

    // 1. Obter dados da clínica
    const { data: clinica, error: clinicaError } = await db
      .from(TABLES.clinicas as any)
      .select('nome, cnpj, plano_status, plano_expira_em, asaas_customer_id, asaas_subscription_id')
      .eq('id', cid)
      .single();

    if (clinicaError || !clinica) return err('Clínica não encontrada', 404);

    let planoExpiraEm = clinica.plano_expira_em;
    if (!planoExpiraEm) {
      // Tentar obter do bio do administrador como fallback para clínicas antigas
      const { data: profissionais } = await db
        .from(TABLES.profissionais as any)
        .select('bio')
        .eq('clinica_id', cid);
      
      const adminProf = (profissionais || []).find((p: any) => {
        try {
          const meta = JSON.parse(p.bio || '{}');
          return meta.role === 'admin';
        } catch { return false; }
      });

      if (adminProf?.bio) {
        try {
          const meta = JSON.parse(adminProf.bio);
          if (meta.trialEndsAt) {
            planoExpiraEm = meta.trialEndsAt;
          }
        } catch {}
      }
    }

    // 2. Obter quantidade de profissionais ativos
    const { data: profissionais, error: profError } = await db
      .from(TABLES.profissionais as any)
      .select('id')
      .eq('clinica_id', cid);

    if (profError) return err(profError.message, 500);

    const profCount = profissionais?.length || 0;
    const baseLimit = 3;
    const extraProfs = Math.max(0, profCount - baseLimit);
    const basePrice = 49.90;
    const extraPrice = 19.90;
    const totalPrice = basePrice + (extraProfs * extraPrice);

    return NextResponse.json({
      clinica: {
        ...toCamelCase(clinica),
        planoExpiraEm, // Garante que a data calculada (ou fallback) seja retornada
      },
      totalProfessionals: profCount,
      baseLimit,
      extraProfessionals: extraProfs,
      basePrice,
      extraPrice,
      totalPrice,
      isTrialExpired: planoExpiraEm ? new Date(planoExpiraEm) < new Date() : false,
    });
  } catch (e: any) {
    return err(e.message, 500);
  }
}
