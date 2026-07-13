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
exports.FinanceiroService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FinanceiroService = class FinanceiroService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(clinicaId, data) {
        return this.prisma.financeiro.create({
            data: {
                ...data,
                clinicaId,
            },
        });
    }
    async findAll(clinicaId) {
        return this.prisma.financeiro.findMany({
            where: { clinicaId },
            include: {
                paciente: { select: { id: true, nome: true } },
                profissional: { select: { id: true, nome: true } },
                consulta: { select: { id: true, dataHoraInicio: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(clinicaId, id) {
        const financa = await this.prisma.financeiro.findFirst({
            where: { id, clinicaId },
            include: {
                paciente: true,
                profissional: true,
                consulta: true
            }
        });
        if (!financa)
            throw new common_1.NotFoundException('Registro financeiro não encontrado');
        return financa;
    }
    async update(clinicaId, id, data) {
        await this.findOne(clinicaId, id);
        return this.prisma.financeiro.update({
            where: { id },
            data,
        });
    }
    async remove(clinicaId, id) {
        await this.findOne(clinicaId, id);
        return this.prisma.financeiro.update({
            where: { id },
            data: { statusPagamento: 'cancelado' },
        });
    }
};
exports.FinanceiroService = FinanceiroService;
exports.FinanceiroService = FinanceiroService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinanceiroService);
//# sourceMappingURL=financeiro.service.js.map