import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return err('E-mail é obrigatório');

    const db = getSupabase();
    
    // Obter URL base correta (localhost no dev ou a URL real em prod)
    // Se a aplicação estiver em um subdomínio ou em Vercel, isso ajuda o Supabase a montar o link
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUrl = `${origin}/login/nova-senha`;

    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      return err(`Não foi possível enviar o e-mail: ${error.message}`);
    }

    return NextResponse.json({ success: true, message: 'E-mail de recuperação enviado com sucesso.' });
  } catch (e: any) {
    return err(e.message || 'Erro interno no servidor', 500);
  }
}
