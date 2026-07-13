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

// GET /api/pacientes
export async function GET(req: NextRequest) {
  try {
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    const db = getSupabase();
    const { data, error } = await db.from(TABLES.pacientes).select('*').eq('clinica_id', cid).order('nome', { ascending: true });
    if (error) return err(error.message, 500);
    const result = toCamelCase(data ?? []);
    return NextResponse.json(result.map((p: any) => ({ ...p, cpf: decrypt(p.cpf) })));
  } catch (e: any) { return err(e.message, 500); }
}

// POST /api/pacientes
export async function POST(req: NextRequest) {
  try {
    const cid = clinicaId(req);
    if (!cid) return err('clinica_id obrigatório', 401);
    const body = await req.json();
    const { cpf, ...rest } = body;
    const payload = toSnakeCase({ ...rest, cpf: encrypt(cpf), clinicaId: cid });
    const db = getSupabase();
    const { data, error } = await db.from(TABLES.pacientes).insert(payload).select().single();
    if (error) return err(error.message, 500);
    const res = toCamelCase(data);
    return NextResponse.json({ ...res, cpf: decrypt(res.cpf) }, { status: 201 });
  } catch (e: any) { return err(e.message, 500); }
}
