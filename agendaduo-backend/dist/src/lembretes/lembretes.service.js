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
var LembretesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LembretesService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const supabase_service_1 = require("../supabase/supabase.service");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let LembretesService = LembretesService_1 = class LembretesService {
    supabase;
    httpService;
    logger = new common_1.Logger(LembretesService_1.name);
    constructor(supabase, httpService) {
        this.supabase = supabase;
        this.httpService = httpService;
    }
    async processLembretes() {
        this.logger.log('Iniciando processamento de lembretes...');
        const { data: configs, error: cfgErr } = await this.supabase.db
            .from(supabase_service_1.TABLES.lembretesConfig)
            .select(`*, clinica:${supabase_service_1.TABLES.clinicas}(nome, n8n_webhook_url, endereco)`)
            .eq('ativo', true);
        if (cfgErr || !configs?.length)
            return;
        for (const config of configs) {
            let hours = 24;
            if (config.antecedencia === '2h')
                hours = 2;
            if (config.antecedencia === '1h')
                hours = 1;
            if (config.antecedencia.endsWith('m'))
                hours = parseInt(config.antecedencia) / 60;
            else if (config.antecedencia.endsWith('h'))
                hours = parseInt(config.antecedencia);
            else if (config.antecedencia.endsWith('d'))
                hours = parseInt(config.antecedencia) * 24;
            const targetTime = new Date();
            targetTime.setTime(targetTime.getTime() + hours * 3600 * 1000);
            const windowStart = new Date(targetTime.getTime() - 2 * 60000);
            const { data: consultas } = await this.supabase.db
                .from(supabase_service_1.TABLES.consultas)
                .select(`*, paciente:${supabase_service_1.TABLES.pacientes}(nome,telefone), profissional:${supabase_service_1.TABLES.profissionais}(nome,bio), servico:${supabase_service_1.TABLES.servicos}(nome)`)
                .eq('clinica_id', config.clinica_id)
                .in('status', ['agendado', 'confirmado'])
                .gte('data_hora_inicio', windowStart.toISOString())
                .lte('data_hora_inicio', targetTime.toISOString());
            for (const consulta of (consultas ?? [])) {
                const { data: sent } = await this.supabase.db
                    .from(supabase_service_1.TABLES.lembretesLog)
                    .select('id, status')
                    .eq('consulta_id', consulta.id)
                    .eq('antecedencia', config.antecedencia)
                    .single();
                if (sent?.status === 'enviado')
                    continue;
                try {
                    let instName = null;
                    if (consulta.profissional?.bio) {
                        try {
                            const bio = JSON.parse(consulta.profissional.bio);
                            instName = bio.whatsappInstanceName || null;
                        }
                        catch (e) { }
                    }
                    const payload = {
                        evento: 'lembrete_consulta',
                        clinica_id: config.clinica_id,
                        clinica_nome: config.clinica.nome,
                        paciente_nome: consulta.paciente?.nome,
                        paciente_telefone: consulta.paciente?.telefone,
                        profissional_nome: consulta.profissional?.nome,
                        instancia_whatsapp: instName,
                        servico: consulta.servico?.nome,
                        data_hora: consulta.data_hora_inicio,
                        antecedencia: config.antecedencia,
                        tipo_atendimento: consulta.tipo_atendimento || 'presencial',
                        endereco_clinica: (!consulta.tipo_atendimento || consulta.tipo_atendimento === 'presencial') ? config.clinica.endereco : null,
                    };
                    const webhookUrl = 'https://criadordigital-n8n-webhook.5rqumh.easypanel.host/webhook/lembretes-clinicas';
                    await (0, rxjs_1.firstValueFrom)(this.httpService.post(webhookUrl, payload));
                    await this.supabase.db.from(supabase_service_1.TABLES.lembretesLog).insert({
                        consulta_id: consulta.id,
                        antecedencia: config.antecedencia,
                        status: 'enviado',
                    });
                }
                catch (error) {
                    this.logger.error(`Erro ao enviar lembrete (Consulta ${consulta.id}): ${error.message}`);
                    await this.supabase.db.from(supabase_service_1.TABLES.lembretesLog).insert({
                        consulta_id: consulta.id,
                        antecedencia: config.antecedencia,
                        status: 'falhou',
                    });
                }
            }
        }
    }
    async processAniversarios() {
        const now = new Date();
        const brTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        const hh = String(brTime.getHours()).padStart(2, '0');
        const mm = String(brTime.getMinutes()).padStart(2, '0');
        const currentHourMin = `${hh}:${mm}`;
        const todayMMDD = String(brTime.getMonth() + 1).padStart(2, '0') + '-' + String(brTime.getDate()).padStart(2, '0');
        const { data: clinicas } = await this.supabase.db
            .from(supabase_service_1.TABLES.clinicas)
            .select('id, nome, lembrete_aniversario_horario')
            .eq('lembrete_aniversario_ativo', true)
            .eq('lembrete_aniversario_horario', currentHourMin);
        if (!clinicas || clinicas.length === 0)
            return;
        for (const clinica of clinicas) {
            this.logger.log(`Processando aniversários para clínica ${clinica.nome} às ${currentHourMin}`);
            const { data: pacientes } = await this.supabase.db
                .from(supabase_service_1.TABLES.pacientes)
                .select('id, nome, telefone, data_nascimento')
                .eq('clinica_id', clinica.id)
                .not('data_nascimento', 'is', null);
            const aniversariantes = (pacientes || []).filter(p => {
                if (!p.data_nascimento)
                    return false;
                return p.data_nascimento.substring(5, 10) === todayMMDD;
            });
            if (aniversariantes.length === 0)
                continue;
            const { data: profissionais } = await this.supabase.db
                .from(supabase_service_1.TABLES.profissionais)
                .select('bio')
                .eq('clinica_id', clinica.id);
            let instName = null;
            if (profissionais && profissionais.length > 0) {
                for (const p of profissionais) {
                    if (p.bio) {
                        try {
                            const bio = JSON.parse(p.bio);
                            if (bio.whatsappInstanceName) {
                                instName = bio.whatsappInstanceName;
                                break;
                            }
                        }
                        catch (e) { }
                    }
                }
            }
            for (const paciente of aniversariantes) {
                try {
                    const payload = {
                        evento: 'lembrete_aniversario',
                        clinica_id: clinica.id,
                        clinica_nome: clinica.nome,
                        paciente_nome: paciente.nome,
                        paciente_telefone: paciente.telefone,
                        instancia_whatsapp: instName,
                        data_aniversario: paciente.data_nascimento,
                    };
                    const webhookUrl = process.env.DEFAULT_N8N_WEBHOOK_ANIVERSARIO_URL || 'https://criadordigital-n8n-webhook.5rqumh.easypanel.host/webhook/lembretes-aniversario-clinicas';
                    await (0, rxjs_1.firstValueFrom)(this.httpService.post(webhookUrl, payload));
                    this.logger.log(`Lembrete de aniversário enviado para ${paciente.nome}`);
                }
                catch (error) {
                    this.logger.error(`Erro ao enviar aniversário para ${paciente.nome}: ${error.message}`);
                }
            }
        }
    }
};
exports.LembretesService = LembretesService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LembretesService.prototype, "processLembretes", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LembretesService.prototype, "processAniversarios", null);
exports.LembretesService = LembretesService = LembretesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        axios_1.HttpService])
], LembretesService);
//# sourceMappingURL=lembretes.service.js.map