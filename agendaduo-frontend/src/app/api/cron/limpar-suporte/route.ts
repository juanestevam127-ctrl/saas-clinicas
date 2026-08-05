import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

export async function GET(req: NextRequest) {
  try {
    // Autenticação básica para CRON (Opcional, usando header Authorization)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return err('Unauthorized', 401);
    }

    // Para a limpeza, precisamos do SERVICE_ROLE key para bypass no RLS e poder deletar do Storage
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return err('Supabase variables missing', 500);
    }

    const adminDb = createClient(supabaseUrl, supabaseServiceKey);

    // Data de corte: 15 dias atrás
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 15);
    const cutoffString = cutoffDate.toISOString();

    // Busca as mensagens com anexo que são mais antigas que 15 dias
    const { data: mensagens, error: fetchError } = await adminDb
      .from('sistema_clinicas_agenciaduo_suporte_mensagens')
      .select('id, anexo_url, mensagem')
      .not('anexo_url', 'is', null)
      .lt('created_at', cutoffString);

    if (fetchError) throw fetchError;

    if (!mensagens || mensagens.length === 0) {
      return NextResponse.json({ success: true, message: 'Nenhum anexo expirado encontrado.' });
    }

    let deletedCount = 0;

    for (const msg of mensagens) {
      try {
        if (!msg.anexo_url) continue;
        
        // O anexo_url é algo como: https://.../storage/v1/object/public/imagens-suporte-marcai/clinica_id/ticket_id/file.png
        // Precisamos extrair o path exato dentro do bucket
        const urlParts = msg.anexo_url.split('/imagens-suporte-marcai/');
        if (urlParts.length === 2) {
          const filePath = urlParts[1]; // clinica_id/ticket_id/file.png
          
          // Deleta do storage
          const { error: storageError } = await adminDb.storage
            .from('imagens-suporte-marcai')
            .remove([filePath]);
            
          if (storageError) console.error(`Erro ao deletar arquivo ${filePath}:`, storageError);
        }

        // Atualiza a mensagem no banco para não ter mais anexo, mas mantendo o texto se houver
        await adminDb
          .from('sistema_clinicas_agenciaduo_suporte_mensagens')
          .update({ 
            anexo_url: null,
            mensagem: msg.mensagem ? `${msg.mensagem}\n\n[Anexo expirado após 15 dias]` : '[Anexo expirado após 15 dias]'
          })
          .eq('id', msg.id);

        deletedCount++;
      } catch (innerErr) {
        console.error('Erro ao processar mensagem', msg.id, innerErr);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Limpeza concluída. ${deletedCount} anexos removidos.` 
    });

  } catch (e: any) {
    console.error('CRON Limpeza Suporte Error:', e);
    return err(e.message, 500);
  }
}
