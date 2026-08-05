import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES } from '@/lib/supabase';

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const clinicaId = req.headers.get('x-clinica-id');
    const isMaster = req.headers.get('x-is-master') === 'true';

    const db = getSupabase();

    if (isMaster) {
      // Master vê todos os tickets
      const { data, error } = await db
        .from('sistema_clinicas_agenciaduo_suporte_tickets')
        .select(`
          *,
          clinica:clinica_id (nome),
          mensagens:sistema_clinicas_agenciaduo_suporte_mensagens (id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json(data);
    } else {
      if (!clinicaId) return err('Falta x-clinica-id');
      
      const { data, error } = await db
        .from('sistema_clinicas_agenciaduo_suporte_tickets')
        .select(`
          *,
          mensagens:sistema_clinicas_agenciaduo_suporte_mensagens (id)
        `)
        .eq('clinica_id', clinicaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const clinicaId = req.headers.get('x-clinica-id');
    const profissionalId = req.headers.get('x-profissional-id');
    if (!clinicaId || !profissionalId) return err('Faltam headers');

    const body = await req.json();
    const { assunto, mensagem, anexoUrl, remetenteNome } = body;
    if (!assunto || !mensagem) return err('Assunto e mensagem são obrigatórios');

    const db = getSupabase();

    // Cria o ticket
    const { data: ticket, error: ticketError } = await db
      .from('sistema_clinicas_agenciaduo_suporte_tickets')
      .insert({
        clinica_id: clinicaId,
        usuario_id: profissionalId,
        assunto,
        status: 'aberto'
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    // Cria a primeira mensagem
    const { error: msgError } = await db
      .from('sistema_clinicas_agenciaduo_suporte_mensagens')
      .insert({
        ticket_id: ticket.id,
        remetente_tipo: 'cliente',
        remetente_id: profissionalId,
        remetente_nome: remetenteNome || 'Usuário',
        mensagem,
        anexo_url: anexoUrl || null
      });

    if (msgError) throw msgError;

    return NextResponse.json(ticket);
  } catch (e: any) {
    return err(e.message, 500);
  }
}
