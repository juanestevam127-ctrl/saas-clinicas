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
exports.AuditoriaInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AuditoriaInterceptor = class AuditoriaInterceptor {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const { method, url, body, user, clinicaId, ip } = req;
        return next.handle().pipe((0, operators_1.tap)(async (dadosNovos) => {
            if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
                const userId = user?.sub || 'system';
                if (!clinicaId)
                    return;
                const entidade = url.split('/')[1] || 'unknown';
                const acao = method;
                await this.prisma.auditoria.create({
                    data: {
                        clinicaId,
                        usuarioId: userId,
                        acao,
                        entidade,
                        entidadeId: dadosNovos?.id || 'unknown',
                        dadosAnteriores: (method === 'PATCH' || method === 'PUT') ? { info: 'VER_HISTORICO' } : client_1.Prisma.JsonNull,
                        dadosNovos: dadosNovos || body,
                        ip: ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
                    },
                });
            }
        }));
    }
};
exports.AuditoriaInterceptor = AuditoriaInterceptor;
exports.AuditoriaInterceptor = AuditoriaInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditoriaInterceptor);
//# sourceMappingURL=auditoria.interceptor.js.map