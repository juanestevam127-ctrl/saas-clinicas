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
exports.ConfiguracoesController = void 0;
const common_1 = require("@nestjs/common");
const configuracoes_service_1 = require("./configuracoes.service");
const clerk_auth_guard_1 = require("../common/guards/clerk-auth.guard");
const tenant_decorator_1 = require("../common/decorators/tenant.decorator");
let ConfiguracoesController = class ConfiguracoesController {
    configuracoesService;
    constructor(configuracoesService) {
        this.configuracoesService = configuracoesService;
    }
    async getConfiguracoes(clinicaId) {
        return this.configuracoesService.getConfiguracoes(clinicaId);
    }
    async updateConfiguracoes(clinicaId, data) {
        console.log('Recebido PUT /configuracoes com clinicaId:', clinicaId);
        return this.configuracoesService.updateConfiguracoes(clinicaId, data);
    }
};
exports.ConfiguracoesController = ConfiguracoesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ConfiguracoesController.prototype, "getConfiguracoes", null);
__decorate([
    (0, common_1.Put)(),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ConfiguracoesController.prototype, "updateConfiguracoes", null);
exports.ConfiguracoesController = ConfiguracoesController = __decorate([
    (0, common_1.Controller)('configuracoes'),
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard),
    __metadata("design:paramtypes", [configuracoes_service_1.ConfiguracoesService])
], ConfiguracoesController);
//# sourceMappingURL=configuracoes.controller.js.map