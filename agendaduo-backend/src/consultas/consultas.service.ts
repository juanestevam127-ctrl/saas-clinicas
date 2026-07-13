import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService, TABLES } from '../supabase/supabase.service';
import { CreateConsultaDto } from './dto/create-consulta.dto';

@Injectable()
export class ConsultasService {
  constructor(private readonly supabase: SupabaseService) {}

  async checkConflict(profissionalId: string, inicio: Date, fim: Date, ignorarId?: string) {
    let query = this.supabase.db
      .from(TABLES.consultas)
      .select('id')
      .eq('profissional_id', profissionalId)
      .in('status', ['agendado', 'confirmado'])
      .lt('data_hora_inicio', fim.toISOString())
      .gt('data_hora_fim', inicio.toISOString());

    if (ignorarId) query = query.neq('id', ignorarId);

    const { data } = await query;
    if (data && data.length > 0) {
      throw new BadRequestException('O profissional já possui uma consulta neste horário.');
    }
  }

  async checkHorariosFuncionamento(clinicaId: string, inicio: Date, fim: Date) {
    const { data } = await this.supabase.db
      .from(TABLES.clinicas)
      .select('horario_funcionamento')
      .eq('id', clinicaId)
      .single();
    
    if (!data || !data.horario_funcionamento) return;
    
    const spTimeStr = new Date(inicio.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const diaSemana = spTimeStr.getDay(); // 0 a 6 (Dom a Sab)
    const hInicio = spTimeStr.getHours().toString().padStart(2, '0') + ':' + spTimeStr.getMinutes().toString().padStart(2, '0');
    
    const spFimTimeStr = new Date(fim.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const hFim = spFimTimeStr.getHours().toString().padStart(2, '0') + ':' + spFimTimeStr.getMinutes().toString().padStart(2, '0');

    let horariosArray = data.horario_funcionamento;
    if (typeof horariosArray === 'string') {
      try { horariosArray = JSON.parse(horariosArray); } catch (e) {}
    }

    const config = horariosArray[diaSemana];
    
    if (!config || !config.ativo) {
      throw new BadRequestException('A clínica está fechada neste dia da semana.');
    }
    
    if (hInicio < config.inicio || hFim > config.fim) {
      throw new BadRequestException(`O horário do agendamento deve estar dentro do horário de funcionamento (${config.inicio} às ${config.fim}).`);
    }
  }

  async create(clinicaId: string, createdBy: string, data: CreateConsultaDto) {
    const inicio = new Date(data.dataHoraInicio);
    const fim = new Date(data.dataHoraFim);
    if (inicio >= fim) throw new BadRequestException('Início deve ser anterior ao fim.');

    await this.checkHorariosFuncionamento(clinicaId, inicio, fim);
    await this.checkConflict(data.profissionalId, inicio, fim);

    const payload = this.supabase.toSnakeCase({
      clinicaId,
      createdBy,
      pacienteId: data.pacienteId,
      profissionalId: data.profissionalId,
      servicoId: data.servicoId,
      dataHoraInicio: data.dataHoraInicio,
      dataHoraFim: data.dataHoraFim,
      status: data.status ?? 'agendado',
      tipoAtendimento: data.tipoAtendimento || 'presencial',
      observacoes: data.observacoes,
      valorCobrado: data.valorCobrado,
      formaPagamento: data.formaPagamento || 'PIX',
    });

    const { data: result, error } = await this.supabase.db
      .from(TABLES.consultas)
      .insert(payload)
      .select('*, paciente:sistema_clinicas_agenciaduo_pacientes(id,nome), profissional:sistema_clinicas_agenciaduo_profissionais(id,nome), servico:sistema_clinicas_agenciaduo_servicos(id,nome,valor_padrao)')
      .single();
    if (error) throw new Error(error.message);
    return this.supabase.toCamelCase(result);
  }

  async findAll(clinicaId: string) {
    const { data, error } = await this.supabase.db
      .from(TABLES.consultas)
      .select('*, paciente:sistema_clinicas_agenciaduo_pacientes(id,nome), profissional:sistema_clinicas_agenciaduo_profissionais(id,nome), servico:sistema_clinicas_agenciaduo_servicos(id,nome,valor_padrao)')
      .eq('clinica_id', clinicaId)
      .order('data_hora_inicio', { ascending: true });
    if (error) throw new Error(error.message);
    return this.supabase.toCamelCase(data ?? []);
  }

  async findOne(clinicaId: string, id: string) {
    const { data, error } = await this.supabase.db
      .from(TABLES.consultas)
      .select('*, paciente:sistema_clinicas_agenciaduo_pacientes(*), profissional:sistema_clinicas_agenciaduo_profissionais(*), servico:sistema_clinicas_agenciaduo_servicos(*)')
      .eq('id', id)
      .eq('clinica_id', clinicaId)
      .single();
    if (error || !data) throw new NotFoundException('Consulta não encontrada');
    return this.supabase.toCamelCase(data);
  }

  async update(clinicaId: string, id: string, userId: string, updateData: Partial<CreateConsultaDto>) {
    const consulta = await this.findOne(clinicaId, id);

    const payload: any = {};
    if (updateData.pacienteId) payload.pacienteId = updateData.pacienteId;
    if (updateData.profissionalId) payload.profissionalId = updateData.profissionalId;
    if (updateData.servicoId) payload.servicoId = updateData.servicoId;
    if (updateData.dataHoraInicio) payload.dataHoraInicio = updateData.dataHoraInicio;
    if (updateData.dataHoraFim) payload.dataHoraFim = updateData.dataHoraFim;
    if (updateData.status) payload.status = updateData.status;
    if (updateData.observacoes !== undefined) payload.observacoes = updateData.observacoes;
    if (updateData.valorCobrado !== undefined) payload.valorCobrado = updateData.valorCobrado;
    if (updateData.formaPagamento !== undefined) payload.formaPagamento = updateData.formaPagamento;

    if (updateData.dataHoraInicio || updateData.dataHoraFim) {
      const inicio = new Date(updateData.dataHoraInicio ?? consulta.dataHoraInicio);
      const fim = new Date(updateData.dataHoraFim ?? consulta.dataHoraFim);
      await this.checkHorariosFuncionamento(clinicaId, inicio, fim);
      await this.checkConflict(updateData.profissionalId ?? consulta.profissionalId, inicio, fim, id);
    }

    const dbPayload = this.supabase.toSnakeCase(payload);

    const { data, error } = await this.supabase.db
      .from(TABLES.consultas)
      .update(dbPayload)
      .eq('id', id)
      .eq('clinica_id', clinicaId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return this.supabase.toCamelCase(data);
  }

  async remove(clinicaId: string, id: string, userId: string) {
    await this.findOne(clinicaId, id);
    
    // Deleta os históricos vinculados primeiro
    await this.supabase.db
      .from(TABLES.consultaHistorico)
      .delete()
      .eq('consulta_id', id);
    
    // Deleta os logs de lembretes vinculados
    await this.supabase.db
      .from(TABLES.lembretesLog)
      .delete()
      .eq('consulta_id', id);

    // Deleta qualquer lançamento financeiro vinculado à consulta
    await this.supabase.db
      .from(TABLES.financeiro)
      .delete()
      .eq('consulta_id', id);

    // Agora deleta a consulta fisicamente do banco de dados!
    const { data, error } = await this.supabase.db
      .from(TABLES.consultas)
      .delete()
      .eq('id', id)
      .eq('clinica_id', clinicaId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.supabase.toCamelCase(data);
  }
}
