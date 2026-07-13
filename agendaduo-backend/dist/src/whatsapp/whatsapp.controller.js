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
exports.WhatsappController = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_service_1 = require("./whatsapp.service");
const clerk_auth_guard_1 = require("../common/guards/clerk-auth.guard");
let WhatsappController = class WhatsappController {
    whatsappService;
    constructor(whatsappService) {
        this.whatsappService = whatsappService;
    }
    getInstancias() {
        return this.whatsappService.getInstancias();
    }
    createInstance(instanceName) {
        return this.whatsappService.createInstance(instanceName);
    }
    checkStatus(instanceName) {
        return this.whatsappService.checkConnectionState(instanceName);
    }
    logout(instanceName) {
        return this.whatsappService.logoutInstance(instanceName);
    }
    reconnect(instanceName) {
        return this.whatsappService.connectInstance(instanceName);
    }
};
exports.WhatsappController = WhatsappController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "getInstancias", null);
__decorate([
    (0, common_1.Post)('conectar'),
    __param(0, (0, common_1.Body)('instanceName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "createInstance", null);
__decorate([
    (0, common_1.Get)('status/:instanceName'),
    __param(0, (0, common_1.Param)('instanceName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "checkStatus", null);
__decorate([
    (0, common_1.Delete)('desconectar/:instanceName'),
    __param(0, (0, common_1.Param)('instanceName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('reconectar/:instanceName'),
    __param(0, (0, common_1.Param)('instanceName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WhatsappController.prototype, "reconnect", null);
exports.WhatsappController = WhatsappController = __decorate([
    (0, common_1.UseGuards)(clerk_auth_guard_1.ClerkAuthGuard),
    (0, common_1.Controller)('whatsapp'),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsappService])
], WhatsappController);
//# sourceMappingURL=whatsapp.controller.js.map