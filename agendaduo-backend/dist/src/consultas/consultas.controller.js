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
exports.ConsultasController = void 0;
const common_1 = require("@nestjs/common");
const consultas_service_1 = require("./consultas.service");
const create_consulta_dto_1 = require("./dto/create-consulta.dto");
const clerk_auth_guard_1 = require("../common/guards/clerk-auth.guard");
const tenant_decorator_1 = require("../common/decorators/tenant.decorator");
let ConsultasController = class ConsultasController {
    consultasService;
    constructor(consultasService) {
        this.consultasService = consultasService;
    }
    create(clinicaId, createDto, req) {
        const userId = req.user?.sub || 'system';
        return this.consultasService.create(clinicaId, userId, createDto);
    }
    findAll(clinicaId) {
        return this.consultasService.findAll(clinicaId);
    }
    findOne(clinicaId, id) {
        return this.consultasService.findOne(clinicaId, id);
    }
    update(clinicaId, id, updateDto, req) {
        const userId = req.user?.sub || 'system';
        return this.consultasService.update(clinicaId, id, userId, updateDto);
    }
    remove(clinicaId, id, req) {
        const userId = req.user?.sub || 'system';
        return this.consultasService.remove(clinicaId, id, userId);
    }
};
exports.ConsultasController = ConsultasController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_consulta_dto_1.CreateConsultaDto, Object]),
    __metadata("design:returntype", void 0)
], ConsultasController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ConsultasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ConsultasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], ConsultasController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, tenant_decorator_1.Tenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ConsultasController.prototype, "remove", null);
exports.ConsultasController = ConsultasController = __decorate([
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard),
    (0, common_1.Controller)('consultas'),
    __metadata("design:paramtypes", [consultas_service_1.ConsultasService])
], ConsultasController);
//# sourceMappingURL=consultas.controller.js.map