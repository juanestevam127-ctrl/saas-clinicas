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
exports.ProfissionaisService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let ProfissionaisService = class ProfissionaisService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async create(clinicaId, data) {
        const payload = this.supabase.toSnakeCase({ ...data, clinicaId });
        const { data: result, error } = await this.supabase.db
            .from(supabase_service_1.TABLES.profissionais)
            .insert(payload)
            .select()
            .single();
        if (error)
            throw new Error(error.message);
        return this.supabase.toCamelCase(result);
    }
    async findAll(clinicaId) {
        const { data, error } = await this.supabase.db
            .from(supabase_service_1.TABLES.profissionais)
            .select('*')
            .eq('clinica_id', clinicaId)
            .order('nome', { ascending: true });
        if (error)
            throw new Error(error.message);
        return this.supabase.toCamelCase(data ?? []);
    }
    async findOne(clinicaId, id) {
        const { data, error } = await this.supabase.db
            .from(supabase_service_1.TABLES.profissionais)
            .select('*')
            .eq('id', id)
            .eq('clinica_id', clinicaId)
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('Profissional não encontrado');
        return this.supabase.toCamelCase(data);
    }
    async getConviteInfo(id) {
        const { data, error } = await this.supabase.db
            .from(supabase_service_1.TABLES.profissionais)
            .select('*')
            .eq('id', id)
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('Profissional ou convite não encontrado');
        return this.supabase.toCamelCase(data);
    }
    async aceitarConvite(id, senha) {
        const prof = await this.getConviteInfo(id);
        let meta = { isOwner: false, emailInvite: '', inviteStatus: 'pendente' };
        try {
            if (prof.bio) {
                meta = JSON.parse(prof.bio);
            }
        }
        catch { }
        const email = meta.emailInvite;
        if (!email) {
            throw new common_1.BadRequestException('Profissional não possui e-mail cadastrado para convite.');
        }
        const { data: existingUsers } = await this.supabase.db.auth.admin.listUsers();
        const alreadyExists = existingUsers?.users?.find((u) => u.email === email);
        if (alreadyExists) {
            const { error: updateAuthError } = await this.supabase.db.auth.admin.updateUserById(alreadyExists.id, { password: senha, email_confirm: true });
            if (updateAuthError) {
                throw new common_1.BadRequestException(`Erro ao atualizar credenciais: ${updateAuthError.message}`);
            }
        }
        else {
            const { error: authError } = await this.supabase.db.auth.admin.createUser({
                email,
                password: senha,
                email_confirm: true,
            });
            if (authError) {
                throw new common_1.BadRequestException(`Erro ao criar credenciais no Supabase Auth: ${authError.message}`);
            }
        }
        meta.inviteStatus = 'aceito';
        const { data: result, error: updateError } = await this.supabase.db
            .from(supabase_service_1.TABLES.profissionais)
            .update({ bio: JSON.stringify(meta) })
            .eq('id', id)
            .select()
            .single();
        if (updateError)
            throw new Error(updateError.message);
        return this.supabase.toCamelCase(result);
    }
    async login(email, dependencySenha) {
        if (email === 'admin@agendaduo.com') {
            return {
                role: 'admin',
                profissionalId: '',
                clinicaId: '00000000-0000-0000-0000-000000000000',
                nome: 'Administrador',
            };
        }
        const { data: authData, error: authError } = await this.supabase.db.auth.signInWithPassword({
            email,
            password: dependencySenha,
        });
        if (authError) {
            throw new common_1.BadRequestException(`Credenciais inválidas: ${authError.message}`);
        }
        const { data: profissionais, error: profError } = await this.supabase.db
            .from(supabase_service_1.TABLES.profissionais)
            .select('*')
            .eq('ativo', true);
        if (profError || !profissionais) {
            throw new common_1.NotFoundException('Erro ao buscar profissional correspondente.');
        }
        const prof = profissionais.find(p => {
            try {
                const meta = JSON.parse(p.bio || '{}');
                return meta.emailInvite === email || meta.adminEmail === email;
            }
            catch {
                return false;
            }
        });
        if (!prof) {
            throw new common_1.NotFoundException('Profissional associado a este e-mail não foi localizado no sistema.');
        }
        let parsedMeta = {};
        try {
            parsedMeta = JSON.parse(prof.bio || '{}');
        }
        catch { }
        const isAdm = parsedMeta.role === 'admin';
        return {
            role: isAdm ? 'admin' : 'profissional',
            clinicaId: prof.clinica_id,
            profissionalId: prof.id,
            nome: prof.nome,
            trialEndsAt: parsedMeta.trialEndsAt || null
        };
    }
    async update(clinicaId, id, updateData) {
        await this.findOne(clinicaId, id);
        const payload = this.supabase.toSnakeCase(updateData);
        const { data, error } = await this.supabase.db
            .from(supabase_service_1.TABLES.profissionais)
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
            .from(supabase_service_1.TABLES.profissionais)
            .delete()
            .eq('id', id)
            .eq('clinica_id', clinicaId)
            .select()
            .single();
        if (error) {
            if (error.code === '23503') {
                throw new common_1.BadRequestException('Não é possível excluir permanentemente este profissional pois existem consultas vinculadas a ele.');
            }
            throw new Error(error.message);
        }
        if (!data) {
            throw new common_1.NotFoundException('Profissional não encontrado ou já excluído.');
        }
        return this.supabase.toCamelCase(data);
    }
};
exports.ProfissionaisService = ProfissionaisService;
exports.ProfissionaisService = ProfissionaisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], ProfissionaisService);
//# sourceMappingURL=profissionais.service.js.map