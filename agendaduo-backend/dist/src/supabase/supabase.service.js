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
exports.SupabaseService = exports.TABLES = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
exports.TABLES = {
    clinicas: 'sistema_clinicas_agenciaduo_clinicas',
    profissionais: 'sistema_clinicas_agenciaduo_profissionais',
    horarios: 'sistema_clinicas_agenciaduo_horarios_profissionais',
    profissionalServicos: 'sistema_clinicas_agenciaduo_profissional_servicos',
    bloqueios: 'sistema_clinicas_agenciaduo_bloqueios_agenda',
    pacientes: 'sistema_clinicas_agenciaduo_pacientes',
    servicos: 'sistema_clinicas_agenciaduo_servicos',
    consultas: 'sistema_clinicas_agenciaduo_consultas',
    consultaHistorico: 'sistema_clinicas_agenciaduo_consultas_historico',
    lembretesConfig: 'sistema_clinicas_agenciaduo_lembretes_config',
    lembretesLog: 'sistema_clinicas_agenciaduo_lembretes_log',
    whatsappInstancias: 'sistema_clinicas_agenciaduo_whatsapp_instancias',
    financeiro: 'sistema_clinicas_agenciaduo_financeiro',
    auditoria: 'sistema_clinicas_agenciaduo_auditoria',
};
let SupabaseService = class SupabaseService {
    client;
    constructor() {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_KEY;
        if (!url || !key) {
            throw new Error('SUPABASE_URL e SUPABASE_SERVICE_KEY devem estar definidos no .env');
        }
        this.client = (0, supabase_js_1.createClient)(url, key, {
            auth: { persistSession: false },
        });
        console.log('[Supabase] Cliente inicializado para:', url);
    }
    get db() {
        return this.client;
    }
    toSnakeCase(obj) {
        if (!obj || typeof obj !== 'object')
            return obj;
        if (Array.isArray(obj))
            return obj.map(v => this.toSnakeCase(v));
        const newObj = {};
        for (const key of Object.keys(obj)) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            newObj[snakeKey] = this.toSnakeCase(obj[key]);
        }
        return newObj;
    }
    toCamelCase(obj) {
        if (!obj || typeof obj !== 'object')
            return obj;
        if (Array.isArray(obj))
            return obj.map(v => this.toCamelCase(v));
        if (obj instanceof Date)
            return obj;
        const newObj = {};
        for (const key of Object.keys(obj)) {
            const camelKey = key.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''));
            newObj[camelKey] = this.toCamelCase(obj[key]);
        }
        return newObj;
    }
};
exports.SupabaseService = SupabaseService;
exports.SupabaseService = SupabaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SupabaseService);
//# sourceMappingURL=supabase.service.js.map