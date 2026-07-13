"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacientesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const crypto = __importStar(require("crypto"));
let PacientesService = class PacientesService {
    supabase;
    algorithm = 'aes-256-cbc';
    key = Buffer.from((process.env.ENCRYPTION_KEY || '12345678901234567890123456789012').slice(0, 32), 'utf8');
    constructor(supabase) {
        this.supabase = supabase;
    }
    encrypt(text) {
        if (!text)
            return null;
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }
    decrypt(text) {
        if (!text)
            return null;
        try {
            const parts = text.split(':');
            const iv = Buffer.from(parts.shift(), 'hex');
            const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
            let dec = decipher.update(parts.join(':'), 'hex', 'utf8');
            dec += decipher.final('utf8');
            return dec;
        }
        catch {
            return text;
        }
    }
    async create(clinicaId, data) {
        const { cpf, ...rest } = data;
        const payload = this.supabase.toSnakeCase({ ...rest, cpf: this.encrypt(cpf), clinicaId });
        const { data: result, error } = await this.supabase.db
            .from(supabase_service_1.TABLES.pacientes)
            .insert(payload)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        const res = this.supabase.toCamelCase(result);
        return { ...res, cpf: this.decrypt(res.cpf) };
    }
    async findAll(clinicaId) {
        const { data, error } = await this.supabase.db
            .from(supabase_service_1.TABLES.pacientes)
            .select('*')
            .eq('clinica_id', clinicaId)
            .order('nome', { ascending: true });
        if (error)
            throw new Error(error.message);
        const res = this.supabase.toCamelCase(data ?? []);
        return res.map((p) => ({ ...p, cpf: this.decrypt(p.cpf) }));
    }
    async findOne(clinicaId, id) {
        const { data, error } = await this.supabase.db
            .from(supabase_service_1.TABLES.pacientes)
            .select('*')
            .eq('id', id)
            .eq('clinica_id', clinicaId)
            .eq('ativo', true)
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('Paciente não encontrado');
        const res = this.supabase.toCamelCase(data);
        return { ...res, cpf: this.decrypt(res.cpf) };
    }
    async update(clinicaId, id, updateData) {
        await this.findOne(clinicaId, id);
        const { cpf, ...rest } = updateData;
        const payload = { ...rest };
        if (cpf !== undefined)
            payload.cpf = this.encrypt(cpf);
        const dbPayload = this.supabase.toSnakeCase(payload);
        const { data, error } = await this.supabase.db
            .from(supabase_service_1.TABLES.pacientes)
            .update(dbPayload)
            .eq('id', id)
            .eq('clinica_id', clinicaId)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        const res = this.supabase.toCamelCase(data);
        return { ...res, cpf: this.decrypt(res.cpf) };
    }
    async remove(clinicaId, id) {
        const { data, error } = await this.supabase.db
            .from(supabase_service_1.TABLES.pacientes)
            .delete()
            .eq('id', id)
            .eq('clinica_id', clinicaId)
            .select()
            .single();
        if (error) {
            if (error.code === '23503') {
                throw new common_1.BadRequestException('Não é possível excluir permanentemente este paciente pois existem consultas vinculadas a ele.');
            }
            throw new Error(error.message);
        }
        if (!data) {
            throw new common_1.NotFoundException('Paciente não encontrado ou já excluído.');
        }
        return this.supabase.toCamelCase(data);
    }
};
exports.PacientesService = PacientesService;
exports.PacientesService = PacientesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], PacientesService);
//# sourceMappingURL=pacientes.service.js.map