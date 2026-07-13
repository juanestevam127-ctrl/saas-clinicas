"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfiguracoesModule = void 0;
const common_1 = require("@nestjs/common");
const configuracoes_service_1 = require("./configuracoes.service");
const configuracoes_controller_1 = require("./configuracoes.controller");
const supabase_module_1 = require("../supabase/supabase.module");
let ConfiguracoesModule = class ConfiguracoesModule {
};
exports.ConfiguracoesModule = ConfiguracoesModule;
exports.ConfiguracoesModule = ConfiguracoesModule = __decorate([
    (0, common_1.Module)({
        imports: [supabase_module_1.SupabaseModule],
        controllers: [configuracoes_controller_1.ConfiguracoesController],
        providers: [configuracoes_service_1.ConfiguracoesService],
        exports: [configuracoes_service_1.ConfiguracoesService],
    })
], ConfiguracoesModule);
//# sourceMappingURL=configuracoes.module.js.map