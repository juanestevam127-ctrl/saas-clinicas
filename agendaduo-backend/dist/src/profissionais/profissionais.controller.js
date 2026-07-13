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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfissionaisController = void 0;
const common_1 = require("@nestjs/common");
const profissionais_service_1 = require("./profissionais.service");
const create_profissional_dto_1 = require("./dto/create-profissional.dto");
const clerk_auth_guard_1 = require("../common/guards/clerk-auth.guard");
const tenant_decorator_1 = require("../common/decorators/tenant.decorator");
let ProfissionaisController = class ProfissionaisController {
    profissionaisService;
    constructor(profissionaisService) {
        this.profissionaisService = profissionaisService;
    }
    getConviteInfo(id) {
        return this.profissionaisService.getConviteInfo(id);
    }
    aceitarConvite(body) {
        return this.profissionaisService.aceitarConvite(body.id, body.senha);
    }
    login(body) {
        return this.profissionaisService.login(body.email, body.senha);
    }
    create(clinicaId, createDto) {
        return this.profissionaisService.create(clinicaId, createDto);
    }
    findAll(clinicaId) {
        return this.profissionaisService.findAll(clinicaId);
    }
    findOne(clinicaId, id) {
        return this.profissionaisService.findOne(clinicaId, id);
    }
    update(clinicaId, id, updateDto) {
        return this.profissionaisService.update(clinicaId, id, updateDto);
    }
    remove(clinicaId, id) {
        return this.profissionaisService.remove(clinicaId, id);
    }
};
exports.ProfissionaisController = ProfissionaisController;
__decorate([
    (0, common_1.Get)('convite-info/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProfissionaisController.prototype, "getConviteInfo", null);
__decorate([
    (0, common_1.Post)('aceitar-convite'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProfissionaisController.prototype, "aceitarConvite", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProfissionaisController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard),
    (0, common_1.Post)(),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_profissional_dto_1.CreateProfissionalDto]),
    __metadata("design:returntype", void 0)
], ProfissionaisController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard),
    (0, common_1.Get)(),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProfissionaisController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProfissionaisController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard),
    (0, common_1.Patch)(':id'),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ProfissionaisController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProfissionaisController.prototype, "remove", null);
exports.ProfissionaisController = ProfissionaisController = __decorate([
    (0, common_1.Controller)('profissionais'),
    __metadata("design:paramtypes", [profissionais_service_1.ProfissionaisService])
], ProfissionaisController);
//# sourceMappingURL=profissionais.controller.js.map