import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES } from '@/lib/supabase';

// POST /api/webhook/asaas
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event;
    const payment = body.payment;

    if (!payment || !payment.subscription) {
      return NextResponse.json({ received: true, message: 'Sem informações de assinatura' });
    }

    const subId = payment.subscription;
    const db = getSupabase();

    // Buscar a clínica vinculada à assinatura
    const { data: clinica, error: loadErr } = await db
      .from(TABLES.clinicas as any)
      .select('id, plano_expira_em')
      .eq('asaas_subscription_id', subId)
      .single();

    if (loadErr || !clinica) {
      return NextResponse.json({ error: 'Clínica não localizada para esta assinatura' }, { status: 404 });
    }

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      // Definir data de expiração para 30 dias a partir da data de vencimento ou de hoje
      const baseDate = payment.dueDate ? new Date(payment.dueDate) : new Date();
      const nextExpiration = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      await db
        .from(TABLES.clinicas as any)
        .update({
          plano_status: 'ativo',
          plano_expira_em: nextExpiration.toISOString(),
        })
        .eq('id', clinica.id);
    } else if (event === 'PAYMENT_OVERDUE') {
      // Se a fatura venceu e não foi paga, marca como atrasado
      await db
        .from(TABLES.clinicas as any)
        .update({
          plano_status: 'atrasado',
        })
        .eq('id', clinica.id);
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
