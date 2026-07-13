"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
require("dotenv/config");
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const schedule_1 = require("@nestjs/schedule");
const supabase_module_1 = require("./supabase/supabase.module");
const common_module_1 = require("./common/common.module");
const auth_module_1 = require("./auth/auth.module");
const tenants_module_1 = require("./tenants/tenants.module");
const profissionais_module_1 = require("./profissionais/profissionais.module");
const pacientes_module_1 = require("./pacientes/pacientes.module");
const servicos_module_1 = require("./servicos/servicos.module");
const consultas_module_1 = require("./consultas/consultas.module");
const financeiro_module_1 = require("./financeiro/financeiro.module");
const lembretes_module_1 = require("./lembretes/lembretes.module");
const whatsapp_module_1 = require("./whatsapp/whatsapp.module");
const auditoria_module_1 = require("./auditoria/auditoria.module");
const configuracoes_module_1 = require("./configuracoes/configuracoes.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            supabase_module_1.SupabaseModule,
            common_module_1.CommonModule,
            auth_module_1.AuthModule,
            tenants_module_1.TenantsModule,
            profissionais_module_1.ProfissionaisModule,
            pacientes_module_1.PacientesModule,
            servicos_module_1.ServicosModule,
            consultas_module_1.ConsultasModule,
            financeiro_module_1.FinanceiroModule,
            lembretes_module_1.LembretesModule,
            whatsapp_module_1.WhatsappModule,
            auditoria_module_1.AuditoriaModule,
            configuracoes_module_1.ConfiguracoesModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map