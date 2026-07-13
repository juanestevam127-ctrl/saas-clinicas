import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService, TABLES } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async register(email: string, senha: string) {
    if (!email || !senha) throw new BadRequestException('Email e senha são obrigatórios');

    const { data: authData, error: authError } = await this.supabase.db.auth.signUp({
      email,
      password: senha,
    });

    if (authError) {
      throw new BadRequestException(authError.message);
    }

    const { data: clinica, error: clinicaError } = await this.supabase.db
      .from(TABLES.clinicas)
      .insert({ 
        nome: 'Nova Clínica',
        n8n_webhook_url: process.env.DEFAULT_N8N_WEBHOOK_URL || null,
        evolution_api_url: process.env.DEFAULT_EVOLUTION_API_URL || null,
        evolution_api_key: process.env.DEFAULT_EVOLUTION_API_KEY || null
      })
      .select('*')
      .single();

    if (clinicaError || !clinica) {
      throw new BadRequestException('Erro ao criar clínica: ' + clinicaError?.message);
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const bioPayload = JSON.stringify({
      role: 'admin',
      adminEmail: email,
      trialEndsAt: trialEndsAt.toISOString(),
      onboardingCompleted: false,
      isOwner: true,
      inviteStatus: 'aceito'
    });

    const { data: prof, error: profError } = await this.supabase.db
      .from(TABLES.profissionais)
      .insert({
        clinica_id: clinica.id,
        nome: 'Administrador',
        especialidade: '-',
        bio: bioPayload,
        ativo: true
      })
      .select('*')
      .single();

    return {
      message: 'Registro concluído',
      clinicaId: clinica.id,
      profissionalId: prof?.id,
      role: 'admin',
      nome: 'Administrador',
      trialEndsAt
    };
  }
}
