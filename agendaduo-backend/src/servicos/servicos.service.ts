import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService, TABLES } from '../supabase/supabase.service';
import { CreateServicoDto } from './dto/create-servico.dto';

@Injectable()
export class ServicosService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(clinicaId: string, data: CreateServicoDto) {
    const payload = this.supabase.toSnakeCase({ ...data, clinicaId });
    const { data: result, error } = await this.supabase.db
      .from(TABLES.servicos)
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return this.supabase.toCamelCase(result);
  }

  async findAll(clinicaId: string) {
    const { data, error } = await this.supabase.db
      .from(TABLES.servicos)
      .select('*')
      .eq('clinica_id', clinicaId)
      .eq('ativo', true) // Filtra apenas serviços ativos na listagem principal
      .order('nome', { ascending: true });
    if (error) throw new Error(error.message);
    return this.supabase.toCamelCase(data ?? []);
  }

  async findOne(clinicaId: string, id: string) {
    const { data, error } = await this.supabase.db
      .from(TABLES.servicos)
      .select('*')
      .eq('id', id)
      .eq('clinica_id', clinicaId)
      .single();
    if (error || !data) throw new NotFoundException('Serviço não encontrado');
    return this.supabase.toCamelCase(data);
  }

  async update(clinicaId: string, id: string, updateData: Partial<CreateServicoDto>) {
    await this.findOne(clinicaId, id);
    const payload = this.supabase.toSnakeCase(updateData);
    const { data, error } = await this.supabase.db
      .from(TABLES.servicos)
      .update(payload)
      .eq('id', id)
      .eq('clinica_id', clinicaId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return this.supabase.toCamelCase(data);
  }

  async remove(clinicaId: string, id: string) {
    const { data, error } = await this.supabase.db
      .from(TABLES.servicos)
      .delete()
      .eq('id', id)
      .eq('clinica_id', clinicaId)
      .select()
      .single();

    if (error) {
      if (error.code === '23503') { // Foreign key constraint violation
        throw new BadRequestException('Não é possível excluir permanentemente este serviço pois existem consultas vinculadas a ele.');
      }
      throw new Error(error.message);
    }

    if (!data) {
      throw new NotFoundException('Serviço não encontrado ou já excluído.');
    }

    return this.supabase.toCamelCase(data);
  }
}
