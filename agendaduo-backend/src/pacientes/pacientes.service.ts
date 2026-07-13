import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService, TABLES } from '../supabase/supabase.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import * as crypto from 'crypto';

@Injectable()
export class PacientesService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key = Buffer.from(
    (process.env.ENCRYPTION_KEY || '12345678901234567890123456789012').slice(0, 32),
    'utf8',
  );

  constructor(private readonly supabase: SupabaseService) {}

  private encrypt(text: string | null | undefined): string | null {
    if (!text) return null;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(text: string | null | undefined): string | null {
    if (!text) return null;
    try {
      const parts = text.split(':');
      const iv = Buffer.from(parts.shift()!, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      let dec = decipher.update(parts.join(':'), 'hex', 'utf8');
      dec += decipher.final('utf8');
      return dec;
    } catch {
      return text;
    }
  }

  async create(clinicaId: string, data: CreatePacienteDto) {
    const { cpf, ...rest } = data;
    const payload = this.supabase.toSnakeCase({ ...rest, cpf: this.encrypt(cpf), clinicaId });
    const { data: result, error } = await this.supabase.db
      .from(TABLES.pacientes)
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const res = this.supabase.toCamelCase(result);
    return { ...res, cpf: this.decrypt(res.cpf) };
  }

  async findAll(clinicaId: string) {
    const { data, error } = await this.supabase.db
      .from(TABLES.pacientes)
      .select('*')
      .eq('clinica_id', clinicaId)
      .order('nome', { ascending: true });
    if (error) throw new Error(error.message);
    const res = this.supabase.toCamelCase(data ?? []);
    return res.map((p: any) => ({ ...p, cpf: this.decrypt(p.cpf) }));
  }

  async findOne(clinicaId: string, id: string) {
    const { data, error } = await this.supabase.db
      .from(TABLES.pacientes)
      .select('*')
      .eq('id', id)
      .eq('clinica_id', clinicaId)
      .eq('ativo', true)
      .single();
    if (error || !data) throw new NotFoundException('Paciente não encontrado');
    const res = this.supabase.toCamelCase(data);
    return { ...res, cpf: this.decrypt(res.cpf) };
  }

  async update(clinicaId: string, id: string, updateData: Partial<CreatePacienteDto>) {
    await this.findOne(clinicaId, id);
    const { cpf, ...rest } = updateData;
    const payload: any = { ...rest };
    if (cpf !== undefined) payload.cpf = this.encrypt(cpf);
    const dbPayload = this.supabase.toSnakeCase(payload);
    
    const { data, error } = await this.supabase.db
      .from(TABLES.pacientes)
      .update(dbPayload)
      .eq('id', id)
      .eq('clinica_id', clinicaId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    const res = this.supabase.toCamelCase(data);
    return { ...res, cpf: this.decrypt(res.cpf) };
  }

  async remove(clinicaId: string, id: string) {
    // Removemos a checagem 'findOne' pois ela falha para registros já inativados
    const { data, error } = await this.supabase.db
      .from(TABLES.pacientes)
      .delete()
      .eq('id', id)
      .eq('clinica_id', clinicaId)
      .select()
      .single();

    if (error) {
      if (error.code === '23503') { // Foreign key constraint violation
        throw new BadRequestException('Não é possível excluir permanentemente este paciente pois existem consultas vinculadas a ele.');
      }
      throw new Error(error.message);
    }
    
    if (!data) {
      throw new NotFoundException('Paciente não encontrado ou já excluído.');
    }
    
    return this.supabase.toCamelCase(data);
  }
}
