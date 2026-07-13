"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultasService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let ConsultasService = class ConsultasService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async checkConflict(profissionalId, inicio, fim, ignorarId) {
        let query = this.supabase.db
            .from(supabase_service_1.TABLES.consultas)
            .select('id')
            .eq('profissional_id', profissionalId)
            .in('status', ['agendado', 'confirmado'])
            .lt('data_hora_inicio', fim.toISOString())
            .gt('data_hora_fim', inicio.toISOString());
        if (ignorarId)
            query = query.neq('id', ignorarId);
        const { data } = await query;
        if (data && data.length > 0) {
            throw new common_1.BadRequestException('O profissional já possui uma consulta neste horário.');
        }
    }
    async checkHorariosFuncionamento(clinicaId, inicio, fim) {
        const { data } = await this.supabase.db
            .from(supabase_service_1.TABLES.clinicas)
            .select('horario_funcionamento')
            .eq('id', clinicaId)
            .single();
        if (!data || !data.horario_funcionamento)
            return;
        const spTimeStr = new Date(inicio.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        const diaSemana = spTimeStr.getDay();
        const hInicio = spTimeStr.getHours().toString().padStart(2, '0') + ':' + spTimeStr.getMinutes().toString().padStart(2, '0');
        const spFimTimeStr = new Date(fim.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        const hFim = spFimTimeStr.getHours().toString().padStart(2, '0') + ':' + spFimTimeStr.getMinutes().toString().padStart(2, '0');
        let horariosArray = data.horario_funcionamento;
        if (typeof horariosArray === 'string') {
            try {
                horariosArray = JSON.parse(horariosArray);
            }
            catch (e) { }
        }
        const config = horariosArray[diaSemana];
        if (!config || !config.ativo) {
            throw new common_1.BadRequestException('A clínica está fechada neste dia da semana.');
        }
        if (hInicio < config.inicio || hFim > config.fim) {
            throw new common_1.BadRequestException(`O horário do agendamento deve estar dentro do horário de funcionamento (${config.inicio} às ${config.fim}).`);
        }
    }
    async create(clinicaId, createdBy, data) {
        const inicio = new Date(data.dataHoraInicio);
        const fim = new Date(data.dataHoraFim);
        if (inicio >= fim)
            throw new common_1.BadRequestException('Início deve ser anterior ao fim.');
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
            .from(supabase_service_1.TABLES.consultas)
            .insert(payload)
            .select('*, paciente:sistema_clinicas_agenciaduo_pacientes(id,nome), profissional:sistema_clinicas_agenciaduo_profissionais(id,nome), servico:sistema_clinicas_agenciaduo_servicos(id,nome,valor_padrao)')
            .single();
        if (error)
            throw new Error(error.message);
        return this.supabase.toCamelCase(result);
    }
    async findAll(clinicaId) {
        const { data, error } = await this.supabase.db
            .from(supabase_service_1.TABLES.consultas)
            .select('*, paciente:sistema_clinicas_agenciaduo_pacientes(id,nome), profissional:sistema_clinicas_agenciaduo_profissionais(id,nome), servico:sistema_clinicas_agenciaduo_servicos(id,nome,valor_padrao)')
            .eq('clinica_id', clinicaId)
            .order('data_hora_inicio', { ascending: true });
        if (error)
            throw new Error(error.message);
        return this.supabase.toCamelCase(data ?? []);
    }
    async findOne(clinicaId, id) {
        const { data, error } = await this.supabase.db
            .from(supabase_service_1.TABLES.consultas)
            .select('*, paciente:sistema_clinicas_agenciaduo_pacientes(*), profissional:sistema_clinicas_agenciaduo_profissionais(*), servico:sistema_clinicas_agenciaduo_servicos(*)')
            .eq('id', id)
            .eq('clinica_id', clinicaId)
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('Consulta não encontrada');
        return this.supabase.toCamelCase(data);
    }
    async update(clinicaId, id, userId, updateData) {
        const consulta = await this.findOne(clinicaId, id);
        const payload = {};
        if (updateData.pacienteId)
            payload.pacienteId = updateData.pacienteId;
        if (updateData.profissionalId)
            payload.profissionalId = updateData.profissionalId;
        if (updateData.servicoId)
            payload.servicoId = updateData.servicoId;
        if (updateData.dataHoraInicio)
            payload.dataHoraInicio = updateData.dataHoraInicio;
        if (updateData.dataHoraFim)
            payload.dataHoraFim = updateData.dataHoraFim;
        if (updateData.status)
            payload.status = updateData.status;
        if (updateData.observacoes !== undefined)
            payload.observacoes = updateData.observacoes;
        if (updateData.valorCobrado !== undefined)
            payload.valorCobrado = updateData.valorCobrado;
        if (updateData.formaPagamento !== undefined)
            payload.formaPagamento = updateData.formaPagamento;
        if (updateData.dataHoraInicio || updateData.dataHoraFim) {
            const inicio = new Date(updateData.dataHoraInicio ?? consulta.dataHoraInicio);
            const fim = new Date(updateData.dataHoraFim ?? consulta.dataHoraFim);
            await this.checkHorariosFuncionamento(clinicaId, inicio, fim);
            await this.checkConflict(updateData.profissionalId ?? consulta.profissionalId, inicio, fim, id);
        }
        const dbPayload = this.supabase.toSnakeCase(payload);
        const { data, error } = await this.supabase.db
            .from(supabase_service_1.TABLES.consultas)
            .update(dbPayload)
            .eq('id', id)
            .eq('clinica_id', clinicaId)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return this.supabase.toCamelCase(data);
    }
    async remove(clinicaId, id, userId) {
        await this.findOne(clinicaId, id);
        await this.supabase.db
            .from(supabase_service_1.TABLES.consultaHistorico)
            .delete()
            .eq('consulta_id', id);
        await this.supabase.db
            .from(supabase_service_1.TABLES.lembretesLog)
            .delete()
            .eq('consulta_id', id);
        await this.supabase.db
            .from(supabase_service_1.TABLES.financeiro)
            .delete()
            .eq('consulta_id', id);
        const { data, error } = await this.supabase.db
            .from(supabase_service_1.TABLES.consultas)
            .delete()
            .eq('id', id)
            .eq('clinica_id', clinicaId)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return this.supabase.toCamelCase(data);
    }
};
exports.ConsultasService = ConsultasService;
exports.ConsultasService = ConsultasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], ConsultasService);
//# sourceMappingURL=consultas.service.js.map