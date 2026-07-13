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
exports.ServicosService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let ServicosService = class ServicosService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async create(clinicaId, data) {
        const payload = this.supabase.toSnakeCase({ ...data, clinicaId });
        const { data: result, error } = await this.supabase.db
            .from(supabase_service_1.TABLES.servicos)
            .insert(payload)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return this.supabase.toCamelCase(result);
    }
    async findAll(clinicaId) {
        const { data, error } = await this.supabase.db
            .from(supabase_service_1.TABLES.servicos)
            .select('*')
            .eq('clinica_id', clinicaId)
            .eq('ativo', true)
            .order('nome', { ascending: true });
        if (error)
            throw new Error(error.message);
        return this.supabase.toCamelCase(data ?? []);
    }
    async findOne(clinicaId, id) {
        const { data, error } = await this.supabase.db
            .from(supabase_service_1.TABLES.servicos)
            .select('*')
            .eq('id', id)
            .eq('clinica_id', clinicaId)
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('Serviço não encontrado');
        return this.supabase.toCamelCase(data);
    }
    async update(clinicaId, id, updateData) {
        await this.findOne(clinicaId, id);
        const payload = this.supabase.toSnakeCase(updateData);
        const { data, error } = await this.supabase.db
            .from(supabase_service_1.TABLES.servicos)
            .update(payload)
            .eq('id', id)
            .eq('clinica_id', clinicaId)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return this.supabase.toCamelCase(data);
    }
    async remove(clinicaId, id) {
        const { data, error } = await this.supabase.db
            .from(supabase_service_1.TABLES.servicos)
            .delete()
            .eq('id', id)
            .eq('clinica_id', clinicaId)
            .select()
            .single();
        if (error) {
            if (error.code === '23503') {
                throw new common_1.BadRequestException('Não é possível excluir permanentemente este serviço pois existem consultas vinculadas a ele.');
            }
            throw new Error(error.message);
        }
        if (!data) {
            throw new common_1.NotFoundException('Serviço não encontrado ou já excluído.');
        }
        return this.supabase.toCamelCase(data);
    }
};
exports.ServicosService = ServicosService;
exports.ServicosService = ServicosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], ServicosService);
//# sourceMappingURL=servicos.service.js.map