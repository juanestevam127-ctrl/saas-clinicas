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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let AuthService = class AuthService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async register(email, senha) {
        if (!email || !senha)
            throw new common_1.BadRequestException('Email e senha são obrigatórios');
        const { data: authData, error: authError } = await this.supabase.db.auth.signUp({
            email,
            password: senha,
        });
        if (authError) {
            throw new common_1.BadRequestException(authError.message);
        }
        const { data: clinica, error: clinicaError } = await this.supabase.db
            .from(supabase_service_1.TABLES.clinicas)
            .insert({
            nome: 'Nova Clínica',
            n8n_webhook_url: process.env.DEFAULT_N8N_WEBHOOK_URL || null,
            evolution_api_url: process.env.DEFAULT_EVOLUTION_API_URL || null,
            evolution_api_key: process.env.DEFAULT_EVOLUTION_API_KEY || null
        })
            .select('*')
            .single();
        if (clinicaError || !clinica) {
            throw new common_1.BadRequestException('Erro ao criar clínica: ' + clinicaError?.message);
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
            .from(supabase_service_1.TABLES.profissionais)
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AuthService);
//# sourceMappingURL=auth.service.js.map