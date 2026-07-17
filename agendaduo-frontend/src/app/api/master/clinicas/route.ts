import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES, toCamelCase } from '@/lib/supabase';

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

// GET /api/master/clinicas
export async function GET(req: NextRequest) {
  try {
    const db = getSupabase();

    // Buscar todas as clínicas
    const { data: clinicas, error: clinicasError } = await db
      .from(TABLES.clinicas)
      .select('*')
      .order('created_at', { ascending: false });

    if (clinicasError) return err(clinicasError.message, 500);

    // Buscar todos os profissionais para mapear o administrador de cada clínica
    const { data: profissionais, error: profError } = await db
      .from(TABLES.profissionais)
      .select('*');

    if (profError) return err(profError.message, 500);

    const result = clinicas.map((c: any) => {
      const clinicaProfs = (profissionais || []).filter((p: any) => p.clinica_id === c.id);
      
      // Encontrar profissional administrador
      const adminProf = clinicaProfs.find((p: any) => {
        try {
          const meta = JSON.parse(p.bio || '{}');
          return meta.role === 'admin';
        } catch { return false; }
      });

      return {
        ...toCamelCase(c),
        adminNome: adminProf?.nome || '—',
        adminEmail: adminProf?.bio ? (JSON.parse(adminProf.bio).adminEmail || JSON.parse(adminProf.bio).emailInvite || '—') : '—',
        adminId: adminProf?.id || '',
        adminEspecialidade: adminProf?.especialidade || '-',
        totalProfessionals: clinicaProfs.length
      };
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return err(e.message, 500);
  }
}
