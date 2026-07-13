import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES, toCamelCase } from '@/lib/supabase';

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

// POST /api/profissionais/aceitar-convite
export async function POST(req: NextRequest) {
  try {
    const { id, senha } = await req.json();
    if (!id || !senha) return err('ID e senha são obrigatórios');

    const db = getSupabase();
    const { data: prof, error: profError } = await db.from(TABLES.profissionais).select('*').eq('id', id).single();
    if (profError || !prof) return err('Profissional ou convite não encontrado', 404);

    let meta = { isOwner: false, emailInvite: '', inviteStatus: 'pendente' };
    try {
      if (prof.bio) meta = JSON.parse(prof.bio);
    } catch {}

    const email = meta.emailInvite;
    if (!email) return err('Profissional não possui e-mail cadastrado para convite.');

    const { data: existingUsers, error: listError } = await db.auth.admin.listUsers();
    if (listError) return err(`Erro ao buscar usuários: ${listError.message}`, 500);

    const alreadyExists = existingUsers?.users?.find((u: any) => u.email === email);

    if (alreadyExists) {
      const { error: updateAuthError } = await db.auth.admin.updateUserById(
        alreadyExists.id,
        { password: senha, email_confirm: true }
      );
      if (updateAuthError) return err(`Erro ao atualizar credenciais: ${updateAuthError.message}`);
    } else {
      const { error: authError } = await db.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
      });
      if (authError) return err(`Erro ao criar credenciais: ${authError.message}`);
    }

    meta.inviteStatus = 'aceito';
    const { data: result, error: updateError } = await db
      .from(TABLES.profissionais)
      .update({ bio: JSON.stringify(meta) })
      .eq('id', id)
      .select()
      .single();

    if (updateError) return err(updateError.message, 500);
    return NextResponse.json(toCamelCase(result));
  } catch (e: any) { return err(e.message, 500); }
}
