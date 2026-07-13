import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService, TABLES } from '../supabase/supabase.service';
import { CreateProfissionalDto } from './dto/create-profissional.dto';

@Injectable()
export class ProfissionaisService {
  constructor(private readonly supabase: SupabaseService) {}

  async create(clinicaId: string, data: CreateProfissionalDto) {
    const payload = this.supabase.toSnakeCase({ ...data, clinicaId });
    const { data: result, error } = await this.supabase.db
      .from(TABLES.profissionais)
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return this.supabase.toCamelCase(result);
  }

  async findAll(clinicaId: string) {
    const { data, error } = await this.supabase.db
      .from(TABLES.profissionais)
      .select('*')
      .eq('clinica_id', clinicaId)
      .order('nome', { ascending: true });
    if (error) throw new Error(error.message);
    return this.supabase.toCamelCase(data ?? []);
  }

  async findOne(clinicaId: string, id: string) {
    const { data, error } = await this.supabase.db
      .from(TABLES.profissionais)
      .select('*')
      .eq('id', id)
      .eq('clinica_id', clinicaId)
      .single();
    if (error || !data) throw new NotFoundException('Profissional não encontrado');
    return this.supabase.toCamelCase(data);
  }

  async getConviteInfo(id: string) {
    const { data, error } = await this.supabase.db
      .from(TABLES.profissionais)
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) throw new NotFoundException('Profissional ou convite não encontrado');
    return this.supabase.toCamelCase(data);
  }

  async aceitarConvite(id: string, senha: string) {
    const prof = await this.getConviteInfo(id);
    
    let meta = { isOwner: false, emailInvite: '', inviteStatus: 'pendente' };
    try {
      if (prof.bio) {
        meta = JSON.parse(prof.bio);
      }
    } catch {}
    
    const email = meta.emailInvite;
    if (!email) {
      throw new BadRequestException('Profissional não possui e-mail cadastrado para convite.');
    }

    // Cria ou atualiza a conta do usuário no Supabase Auth usando admin API
    // Isso garante que o e-mail já vem confirmado automaticamente, sem exigir verificação
    const { data: existingUsers } = await this.supabase.db.auth.admin.listUsers();
    const alreadyExists = existingUsers?.users?.find((u: any) => u.email === email);

    if (alreadyExists) {
      // Atualiza a senha do usuário existente
      const { error: updateAuthError } = await this.supabase.db.auth.admin.updateUserById(
        alreadyExists.id,
        { password: senha, email_confirm: true }
      );
      if (updateAuthError) {
        throw new BadRequestException(`Erro ao atualizar credenciais: ${updateAuthError.message}`);
      }
    } else {
      // Cria novo usuário já confirmado
      const { error: authError } = await this.supabase.db.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
      });
      if (authError) {
        throw new BadRequestException(`Erro ao criar credenciais no Supabase Auth: ${authError.message}`);
      }
    }

    // Atualiza o status do convite para aceito
    meta.inviteStatus = 'aceito';
    const { data: result, error: updateError } = await this.supabase.db
      .from(TABLES.profissionais)
      .update({ bio: JSON.stringify(meta) })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);
    return this.supabase.toCamelCase(result);
  }

  async login(email: string, dependencySenha: string) {
    // Caso de login do Administrador Padrão da Clínica
    if (email === 'admin@agendaduo.com') {
      return {
        role: 'admin',
        profissionalId: '',
        clinicaId: '00000000-0000-0000-0000-000000000000',
        nome: 'Administrador',
      };
    }

    // 1. Tenta fazer login com e-mail e senha usando o Supabase Auth
    const { data: authData, error: authError } = await this.supabase.db.auth.signInWithPassword({
      email,
      password: dependencySenha,
    });

    if (authError) {
      throw new BadRequestException(`Credenciais inválidas: ${authError.message}`);
    }

    // 2. Busca o profissional correspondente por e-mail na coluna bio
    const { data: profissionais, error: profError } = await this.supabase.db
      .from(TABLES.profissionais)
      .select('*')
      .eq('ativo', true);

    if (profError || !profissionais) {
      throw new NotFoundException('Erro ao buscar profissional correspondente.');
    }

    const prof = profissionais.find(p => {
      try {
        const meta = JSON.parse(p.bio || '{}');
        return meta.emailInvite === email || meta.adminEmail === email;
      } catch {
        return false;
      }
    });

    if (!prof) {
      throw new NotFoundException('Profissional associado a este e-mail não foi localizado no sistema.');
    }

    let parsedMeta: any = {};
    try { parsedMeta = JSON.parse(prof.bio || '{}'); } catch {}

    const isAdm = parsedMeta.role === 'admin';

    return {
      role: isAdm ? 'admin' : 'profissional',
      clinicaId: prof.clinica_id,
      profissionalId: prof.id,
      nome: prof.nome,
      trialEndsAt: parsedMeta.trialEndsAt || null
    };
  }

  async update(clinicaId: string, id: string, updateData: Partial<CreateProfissionalDto>) {
    await this.findOne(clinicaId, id);
    const payload = this.supabase.toSnakeCase(updateData);
    const { data, error } = await this.supabase.db
      .from(TABLES.profissionais)
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
      .from(TABLES.profissionais)
      .delete()
      .eq('id', id)
      .eq('clinica_id', clinicaId)
      .select()
      .single();

    if (error) {
      if (error.code === '23503') { // Foreign key constraint violation
        throw new BadRequestException('Não é possível excluir permanentemente este profissional pois existem consultas vinculadas a ele.');
      }
      throw new Error(error.message);
    }

    if (!data) {
      throw new NotFoundException('Profissional não encontrado ou já excluído.');
    }

    return this.supabase.toCamelCase(data);
  }
}
