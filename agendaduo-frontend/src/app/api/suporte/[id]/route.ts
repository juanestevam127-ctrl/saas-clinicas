import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getSupabase();
    
    // Buscar detalhes do ticket
    const { data: ticket, error: ticketError } = await db
      .from('sistema_clinicas_agenciaduo_suporte_tickets')
      .select('*, clinica:clinica_id (nome)')
      .eq('id', id)
      .single();

    if (ticketError) throw ticketError;

    // Buscar mensagens
    const { data: mensagens, error: msgError } = await db
      .from('sistema_clinicas_agenciaduo_suporte_mensagens')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    return NextResponse.json({ ticket, mensagens });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { mensagem, anexoUrl, remetenteTipo, remetenteId, remetenteNome, novoStatus } = body;
    
    if (!mensagem && !novoStatus) return err('Mensagem ou novo status são obrigatórios');

    const db = getSupabase();

    if (mensagem) {
      const { error: msgError } = await db
        .from('sistema_clinicas_agenciaduo_suporte_mensagens')
        .insert({
          ticket_id: id,
          remetente_tipo: remetenteTipo || 'cliente',
          remetente_id: remetenteId || 'desconhecido',
          remetente_nome: remetenteNome || 'Usuário',
          mensagem,
          anexo_url: anexoUrl || null
        });

      if (msgError) throw msgError;
    }

    // Atualiza o status do ticket sempre que houver resposta ou alteração explícita
    const statusUpdate = novoStatus 
      ? novoStatus 
      : (remetenteTipo === 'master' ? 'respondido' : 'aberto');

    const { error: ticketError } = await db
      .from('sistema_clinicas_agenciaduo_suporte_tickets')
      .update({ status: statusUpdate })
      .eq('id', id);

    if (ticketError) throw ticketError;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return err(e.message, 500);
  }
}
