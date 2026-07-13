import { PrismaService } from '../prisma/prisma.service';
import { CreateFinanceiroDto } from './dto/create-financeiro.dto';
export declare class FinanceiroService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(clinicaId: string, data: CreateFinanceiroDto): Promise<{
        id: string;
        observacoes: string | null;
        pacienteId: string | null;
        profissionalId: string | null;
        formaPagamento: string | null;
        valor: import("@prisma/client-runtime-utils").Decimal;
        clinicaId: string;
        createdAt: Date;
        consultaId: string | null;
        statusPagamento: string;
        dataPagamento: Date | null;
    }>;
    findAll(clinicaId: string): Promise<({
        profissional: {
            nome: string;
            id: string;
        } | null;
        paciente: {
            nome: string;
            id: string;
        } | null;
        consulta: {
            id: string;
            dataHoraInicio: Date;
        } | null;
    } & {
        id: string;
        observacoes: string | null;
        pacienteId: string | null;
        profissionalId: string | null;
        formaPagamento: string | null;
        valor: import("@prisma/client-runtime-utils").Decimal;
        clinicaId: string;
        createdAt: Date;
        consultaId: string | null;
        statusPagamento: string;
        dataPagamento: Date | null;
    })[]>;
    findOne(clinicaId: string, id: string): Promise<{
        profissional: {
            nome: string;
            especialidade: string | null;
            bio: string | null;
            ativo: boolean;
            registroProfissional: string | null;
            fotoUrl: string | null;
            duracaoPadraoConsulta: number;
            id: string;
            clinicaId: string;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        paciente: {
            email: string | null;
            nome: string;
            ativo: boolean;
            id: string;
            telefone: string | null;
            dataNascimento: Date | null;
            cpf: string | null;
            genero: string | null;
            observacoes: string | null;
            clinicaId: string;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        consulta: {
            id: string;
            observacoes: string | null;
            pacienteId: string;
            profissionalId: string;
            servicoId: string;
            dataHoraInicio: Date;
            dataHoraFim: Date;
            status: string;
            valorCobrado: import("@prisma/client-runtime-utils").Decimal | null;
            clinicaId: string;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
        } | null;
    } & {
        id: string;
        observacoes: string | null;
        pacienteId: string | null;
        profissionalId: string | null;
        formaPagamento: string | null;
        valor: import("@prisma/client-runtime-utils").Decimal;
        clinicaId: string;
        createdAt: Date;
        consultaId: string | null;
        statusPagamento: string;
        dataPagamento: Date | null;
    }>;
    update(clinicaId: string, id: string, data: Partial<CreateFinanceiroDto>): Promise<{
        id: string;
        observacoes: string | null;
        pacienteId: string | null;
        profissionalId: string | null;
        formaPagamento: string | null;
        valor: import("@prisma/client-runtime-utils").Decimal;
        clinicaId: string;
        createdAt: Date;
        consultaId: string | null;
        statusPagamento: string;
        dataPagamento: Date | null;
    }>;
    remove(clinicaId: string, id: string): Promise<{
        id: string;
        observacoes: string | null;
        pacienteId: string | null;
        profissionalId: string | null;
        formaPagamento: string | null;
        valor: import("@prisma/client-runtime-utils").Decimal;
        clinicaId: string;
        createdAt: Date;
        consultaId: string | null;
        statusPagamento: string;
        dataPagamento: Date | null;
    }>;
}
