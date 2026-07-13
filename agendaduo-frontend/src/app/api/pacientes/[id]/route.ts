import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES, toSnakeCase, toCamelCase } from '@/lib/supabase';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENC_KEY = Buffer.from((process.env.ENCRYPTION_KEY || '12345678901234567890123456789012').slice(0, 32), 'utf8');

function encrypt(text: string | null | undefined): string | null {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENC_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string | null | undefined): string | null {
  if (!text) return null;
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift()!, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENC_KEY, iv);
    let dec = decipher.update(parts.join(':'), 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  } catch { return text; }
}

function clinicaId(req: NextRequest): string {
  return req.headers.get('x-clinica-id') || '';
}

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

// GET /api/pacientes/[id]
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    const db = getSupabase();
    const { data, error } = await db.from(TABLES.pacientes).select('*').eq('id', params.id).eq('clinica_id', cid).eq('ativo', true).single();
    if (error || !data) return err('Paciente não encontrado', 404);
    const res = toCamelCase(data);
    return NextResponse.json({ ...res, cpf: decrypt(res.cpf) });
  } catch (e: any) { return err(e.message, 500); }
}

// PATCH /api/pacientes/[id]
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    const body = await req.json();
    const { cpf, ...rest } = body;

    const db = getSupabase();
    const { data: exist } = await db.from(TABLES.pacientes).select('id').eq('id', params.id).eq('clinica_id', cid).single();
    if (!exist) return err('Paciente não encontrado', 404);

    const payload: any = { ...rest };
    if (cpf !== undefined) payload.cpf = encrypt(cpf);
    const dbPayload = toSnakeCase(payload);

    const { data, error } = await db.from(TABLES.pacientes).update(dbPayload).eq('id', params.id).eq('clinica_id', cid).select().single();
    if (error) return err(error.message, 500);
    const res = toCamelCase(data);
    return NextResponse.json({ ...res, cpf: decrypt(res.cpf) });
  } catch (e: any) { return err(e.message, 500); }
}

// DELETE /api/pacientes/[id]
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    const db = getSupabase();

    const { data, error } = await db.from(TABLES.pacientes).delete().eq('id', params.id).eq('clinica_id', cid).select().single();
    if (error) {
      if (error.code === '23503') {
        return err('Não é possível excluir permanentemente este paciente pois existem consultas vinculadas a ele.');
      }
      return err(error.message, 500);
    }
    if (!data) return err('Paciente não encontrado ou já excluído.', 404);
    return NextResponse.json(toCamelCase(data));
  } catch (e: any) { return err(e.message, 500); }
}
