import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFinanceiroDto } from './dto/create-financeiro.dto';

@Injectable()
export class FinanceiroService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clinicaId: string, data: CreateFinanceiroDto) {
    return this.prisma.financeiro.create({
      data: {
        ...data,
        clinicaId,
      },
    });
  }

  async findAll(clinicaId: string) {
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

  async findOne(clinicaId: string, id: string) {
    const financa = await this.prisma.financeiro.findFirst({
      where: { id, clinicaId },
      include: {
        paciente: true,
        profissional: true,
        consulta: true
      }
    });
    if (!financa) throw new NotFoundException('Registro financeiro não encontrado');
    return financa;
  }

  async update(clinicaId: string, id: string, data: Partial<CreateFinanceiroDto>) {
    await this.findOne(clinicaId, id);
    return this.prisma.financeiro.update({
      where: { id },
      data,
    });
  }

  async remove(clinicaId: string, id: string) {
    await this.findOne(clinicaId, id);
    // Para financeiro, pode ser estorno
    return this.prisma.financeiro.update({
      where: { id },
      data: { statusPagamento: 'cancelado' },
    });
  }
}
