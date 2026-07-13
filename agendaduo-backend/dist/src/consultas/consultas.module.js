"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultasModule = void 0;
const common_1 = require("@nestjs/common");
const consultas_controller_1 = require("./consultas.controller");
const consultas_service_1 = require("./consultas.service");
let ConsultasModule = class ConsultasModule {
};
exports.ConsultasModule = ConsultasModule;
exports.ConsultasModule = ConsultasModule = __decorate([
    (0, common_1.Module)({
        controllers: [consultas_controller_1.ConsultasController],
        providers: [consultas_service_1.ConsultasService],
        exports: [consultas_service_1.ConsultasService],
    })
], ConsultasModule);
//# sourceMappingURL=consultas.module.js.map