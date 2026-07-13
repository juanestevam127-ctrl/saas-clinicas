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
exports.FinanceiroController = void 0;
const common_1 = require("@nestjs/common");
const financeiro_service_1 = require("./financeiro.service");
const create_financeiro_dto_1 = require("./dto/create-financeiro.dto");
const clerk_auth_guard_1 = require("../common/guards/clerk-auth.guard");
const tenant_decorator_1 = require("../common/decorators/tenant.decorator");
let FinanceiroController = class FinanceiroController {
    financeiroService;
    constructor(financeiroService) {
        this.financeiroService = financeiroService;
    }
    create(clinicaId, createDto) {
        return this.financeiroService.create(clinicaId, createDto);
    }
    findAll(clinicaId) {
        return this.financeiroService.findAll(clinicaId);
    }
    findOne(clinicaId, id) {
        return this.financeiroService.findOne(clinicaId, id);
    }
    update(clinicaId, id, updateDto) {
        return this.financeiroService.update(clinicaId, id, updateDto);
    }
    remove(clinicaId, id) {
        return this.financeiroService.remove(clinicaId, id);
    }
};
exports.FinanceiroController = FinanceiroController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_financeiro_dto_1.CreateFinanceiroDto]),
    __metadata("design:returntype", void 0)
], FinanceiroController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinanceiroController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceiroController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], FinanceiroController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceiroController.prototype, "remove", null);
exports.FinanceiroController = FinanceiroController = __decorate([
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard),
    (0, common_1.Controller)('financeiro'),
    __metadata("design:paramtypes", [financeiro_service_1.FinanceiroService])
], FinanceiroController);
//# sourceMappingURL=financeiro.controller.js.map