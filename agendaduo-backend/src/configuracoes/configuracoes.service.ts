import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService, TABLES } from '../supabase/supabase.service';

@Injectable()
export class ConfiguracoesService {
  constructor(private readonly supabase: SupabaseService) {}

  async getConfiguracoes(clinicaId: string) {
    const { data: clinica, error: clinicaError } = await this.supabase.db
      .from(TABLES.clinicas)
      .select('nome, cnpj, telefone, endereco, fuso_horario, horario_funcionamento, n8n_webhook_url, lembrete_aniversario_ativo, lembrete_aniversario_horario')
      .eq('id', clinicaId)
      .single();

    if (clinicaError) throw new InternalServerErrorException(clinicaError.message);

    const { data: lembretes, error: lembretesError } = await this.supabase.db
      .from(TABLES.lembretesConfig)
      .select('id, antecedencia, ativo')
      .eq('clinica_id', clinicaId);

    if (lembretesError) throw new InternalServerErrorException(lembretesError.message);

    return {
      clinica: this.supabase.toCamelCase(clinica),
      lembretes,
    };
  }

  async updateConfiguracoes(clinicaId: string, data: any) {
    const { clinica, lembretes } = data;

    if (clinica) {
      const payload = this.supabase.toSnakeCase(clinica);
      const { error } = await this.supabase.db
        .from(TABLES.clinicas)
        .update(payload)
        .eq('id', clinicaId);
      if (error) throw new InternalServerErrorException(error.message);
    }

    if (lembretes && Array.isArray(lembretes)) {
      // Deleta regras antigas
      await this.supabase.db
        .from(TABLES.lembretesConfig)
        .delete()
        .eq('clinica_id', clinicaId);

      // Insere novas
      const lembretesPayload = lembretes.map(l => ({
        clinica_id: clinicaId,
        antecedencia: l.antecedencia,
        ativo: l.ativo,
      }));

      if (lembretesPayload.length > 0) {
        const { error } = await this.supabase.db
          .from(TABLES.lembretesConfig)
          .insert(lembretesPayload);
        if (error) throw new InternalServerErrorException(error.message);
      }
    }

    return { success: true };
  }
}
