import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES, toSnakeCase, toCamelCase } from '@/lib/supabase';

function clinicaId(req: NextRequest): string {
  return req.headers.get('x-clinica-id') || '';
}

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

// GET /api/prontuarios/arquivos?pacienteId=X
export async function GET(req: NextRequest) {
  try {
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);

    const { searchParams } = new URL(req.url);
    const pacienteId = searchParams.get('pacienteId');
    if (!pacienteId) return err('pacienteId obrigatório', 400);

    const db = getSupabase();
    const { data, error } = await db
      .from(TABLES.prontuariosArquivos)
      .select('*')
      .eq('clinica_id', cid)
      .eq('paciente_id', pacienteId)
      .order('created_at', { ascending: false });

    if (error) return err(error.message, 500);

    return NextResponse.json(toCamelCase(data ?? []));
  } catch (e: any) {
    return err(e.message, 500);
  }
}

// POST /api/prontuarios/arquivos
export async function POST(req: NextRequest) {
  try {
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const pacienteId = formData.get('pacienteId') as string;
    const tipoArquivo = formData.get('tipoArquivo') as string; // 'foto' or 'pdf'

    if (!file || !pacienteId || !tipoArquivo) {
      return err('Campos file, pacienteId e tipoArquivo são obrigatórios', 400);
    }

    // Limite rígido de tamanho: 2MB (2 * 1024 * 1024 bytes)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return err('O arquivo excede o limite máximo permitido de 2MB.', 400);
    }

    const db = getSupabase();
    
    // Obter buffer e enviar para o Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split('.').pop() || '';
    const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const storagePath = `${cid}/${pacienteId}/${safeFileName}`;

    const { data: uploadData, error: uploadError } = await db.storage
      .from('saas-clinicas')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) return err(`Erro de upload: ${uploadError.message}`, 500);

    // Obter URL pública do arquivo
    const { data: urlData } = db.storage
      .from('saas-clinicas')
      .getPublicUrl(storagePath);
    
    const urlArquivo = urlData.publicUrl;

    // Salvar registro no banco de dados
    const payload = toSnakeCase({
      clinicaId: cid,
      pacienteId,
      nomeArquivo: file.name,
      urlArquivo,
      tipoArquivo,
      tamanhoBytes: file.size
    });

    const { data: dbData, error: dbError } = await db
      .from(TABLES.prontuariosArquivos)
      .insert(payload)
      .select()
      .single();

    if (dbError) {
      // Tentar remover o arquivo do Storage caso o banco falhe
      await db.storage.from('saas-clinicas').remove([storagePath]);
      return err(`Erro ao salvar no banco: ${dbError.message}`, 500);
    }

    return NextResponse.json(toCamelCase(dbData), { status: 201 });
  } catch (e: any) {
    return err(e.message, 500);
  }
}

// DELETE /api/prontuarios/arquivos?id=X
export async function DELETE(req: NextRequest) {
  try {
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return err('id obrigatório', 400);

    const db = getSupabase();

    // 1. Buscar metadados do arquivo para pegar o caminho no storage
    const { data: arquivo, error: fetchErr } = await db
      .from(TABLES.prontuariosArquivos)
      .select('*')
      .eq('id', id)
      .eq('clinica_id', cid)
      .single();

    if (fetchErr || !arquivo) return err('Arquivo não localizado', 404);

    // O caminho no storage pode ser extraído da URL do arquivo ou recriado
    // Como criamos no padrão: bucket/clinicaId/pacienteId/filename
    // Extraímos tudo após /saas-clinicas/
    const urlParts = arquivo.url_arquivo.split('/saas-clinicas/');
    if (urlParts.length > 1) {
      const storagePath = decodeURIComponent(urlParts[1]);
      // Deletar do Supabase Storage
      await db.storage.from('saas-clinicas').remove([storagePath]);
    }

    // 2. Deletar do banco de dados
    const { error: dbError } = await db
      .from(TABLES.prontuariosArquivos)
      .delete()
      .eq('id', id);

    if (dbError) return err(dbError.message, 500);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return err(e.message, 500);
  }
}
