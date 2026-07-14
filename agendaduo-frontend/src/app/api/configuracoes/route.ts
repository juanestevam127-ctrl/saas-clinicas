import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES, toSnakeCase, toCamelCase } from '@/lib/supabase';

function clinicaId(req: NextRequest): string {
  return req.headers.get('x-clinica-id') || '';
}

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

// GET /api/configuracoes
export async function GET(req: NextRequest) {
  try {
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    const db = getSupabase();

    const { data: clinica, error: clinicaError } = await db
      .from(TABLES.clinicas)
      .select('nome, cnpj, telefone, endereco, fuso_horario, horario_funcionamento, n8n_webhook_url, lembrete_aniversario_ativo, lembrete_aniversario_horario, msg_lembrete_presencial, msg_lembrete_online, msg_aniversario')
      .eq('id', cid)
      .single();

    if (clinicaError) return err(clinicaError.message, 500);

    const { data: lembretes, error: lembretesError } = await db
      .from(TABLES.lembretesConfig)
      .select('id, antecedencia, ativo')
      .eq('clinica_id', cid);

    if (lembretesError) return err(lembretesError.message, 500);

    return NextResponse.json({
      clinica: toCamelCase(clinica),
      lembretes,
    });
  } catch (e: any) { return err(e.message, 500); }
}

// PUT /api/configuracoes
export async function PUT(req: NextRequest) {
  try {
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    const body = await req.json();
    const { clinica, lembretes } = body;

    const db = getSupabase();

    if (clinica) {
      const payload = toSnakeCase(clinica);
      const { error } = await db
        .from(TABLES.clinicas)
        .update(payload)
        .eq('id', cid);
      if (error) return err(error.message, 500);
    }

    if (lembretes && Array.isArray(lembretes)) {
      // Deleta regras antigas
      await db
        .from(TABLES.lembretesConfig)
        .delete()
        .eq('clinica_id', cid);

      // Insere novas
      const lembretesPayload = lembretes.map(l => ({
        clinica_id: cid,
        antecedencia: l.antecedencia,
        ativo: l.ativo,
      }));

      if (lembretesPayload.length > 0) {
        const { error } = await db
          .from(TABLES.lembretesConfig)
          .insert(lembretesPayload);
        if (error) return err(error.message, 500);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) { return err(e.message, 500); }
}
