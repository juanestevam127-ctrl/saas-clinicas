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
exports.ConfiguracoesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let ConfiguracoesService = class ConfiguracoesService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async getConfiguracoes(clinicaId) {
        const { data: clinica, error: clinicaError } = await this.supabase.db
            .from(supabase_service_1.TABLES.clinicas)
            .select('nome, cnpj, telefone, endereco, fuso_horario, horario_funcionamento, n8n_webhook_url, lembrete_aniversario_ativo, lembrete_aniversario_horario')
            .eq('id', clinicaId)
            .single();
        if (clinicaError)
            throw new common_1.InternalServerErrorException(clinicaError.message);
        const { data: lembretes, error: lembretesError } = await this.supabase.db
            .from(supabase_service_1.TABLES.lembretesConfig)
            .select('id, antecedencia, ativo')
            .eq('clinica_id', clinicaId);
        if (lembretesError)
            throw new common_1.InternalServerErrorException(lembretesError.message);
        return {
            clinica: this.supabase.toCamelCase(clinica),
            lembretes,
        };
    }
    async updateConfiguracoes(clinicaId, data) {
        const { clinica, lembretes } = data;
        if (clinica) {
            const payload = this.supabase.toSnakeCase(clinica);
            const { error } = await this.supabase.db
                .from(supabase_service_1.TABLES.clinicas)
                .update(payload)
                .eq('id', clinicaId);
            if (error)
                throw new common_1.InternalServerErrorException(error.message);
        }
        if (lembretes && Array.isArray(lembretes)) {
            await this.supabase.db
                .from(supabase_service_1.TABLES.lembretesConfig)
                .delete()
                .eq('clinica_id', clinicaId);
            const lembretesPayload = lembretes.map(l => ({
                clinica_id: clinicaId,
                antecedencia: l.antecedencia,
                ativo: l.ativo,
            }));
            if (lembretesPayload.length > 0) {
                const { error } = await this.supabase.db
                    .from(supabase_service_1.TABLES.lembretesConfig)
                    .insert(lembretesPayload);
                if (error)
                    throw new common_1.InternalServerErrorException(error.message);
            }
        }
        return { success: true };
    }
};
exports.ConfiguracoesService = ConfiguracoesService;
exports.ConfiguracoesService = ConfiguracoesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], ConfiguracoesService);
//# sourceMappingURL=configuracoes.service.js.map