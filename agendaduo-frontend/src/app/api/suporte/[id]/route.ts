import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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
    const { mensagem, anexoUrl, anexoBase64, anexoNome, anexoMimeType, remetenteTipo, remetenteId, remetenteNome, novoStatus } = body;
    
    const db = getSupabase();
    
    let finalAnexoUrl = anexoUrl;

    // Buscar o ticket para saber o clinica_id caso precise do upload
    const { data: ticket, error: fetchTicketError } = await db
      .from('sistema_clinicas_agenciaduo_suporte_tickets')
      .select('clinica_id')
      .eq('id', id)
      .single();

    if (fetchTicketError) throw fetchTicketError;

    // Se a imagem for enviada via base64, fazer o upload pelo backend
    if (anexoBase64 && anexoNome) {
      const base64Data = anexoBase64.includes(',') ? anexoBase64.split(',')[1] : anexoBase64;
      const buffer = Buffer.from(base64Data, 'base64');
      const filePath = `${ticket.clinica_id}/${id}/${Date.now()}_${anexoNome}`;
      
      const { error: uploadError } = await db.storage
        .from('imagens-suporte-marcai')
        .upload(filePath, buffer, { 
          contentType: anexoMimeType || 'image/png', 
          upsert: false 
        });
        
      if (uploadError) {
        console.error('Erro no upload backend:', uploadError);
      } else {
        const { data: { publicUrl } } = db.storage
          .from('imagens-suporte-marcai')
          .getPublicUrl(filePath);
        finalAnexoUrl = publicUrl;
      }
    }

    if (!mensagem && !finalAnexoUrl && !novoStatus) return err('Mensagem ou novo status são obrigatórios');

    if (mensagem || finalAnexoUrl) {
      const { error: msgError } = await db
        .from('sistema_clinicas_agenciaduo_suporte_mensagens')
        .insert({
          ticket_id: id,
          remetente_tipo: remetenteTipo || 'cliente',
          remetente_id: remetenteId || 'desconhecido',
          remetente_nome: remetenteNome || 'Usuário',
          mensagem: mensagem || null,
          anexo_url: finalAnexoUrl || null
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
