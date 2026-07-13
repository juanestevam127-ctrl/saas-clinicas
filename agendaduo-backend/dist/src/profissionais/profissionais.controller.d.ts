import { ProfissionaisService } from './profissionais.service';
import { CreateProfissionalDto } from './dto/create-profissional.dto';
export declare class ProfissionaisController {
    private readonly profissionaisService;
    constructor(profissionaisService: ProfissionaisService);
    getConviteInfo(id: string): Promise<any>;
    aceitarConvite(body: {
        id: string;
        senha: string;
    }): Promise<any>;
    login(body: {
        email: string;
        senha: string;
    }): Promise<{
        role: string;
        profissionalId: string;
        clinicaId: string;
        nome: string;
        trialEndsAt?: undefined;
    } | {
        role: string;
        clinicaId: any;
        profissionalId: any;
        nome: any;
        trialEndsAt: any;
    }>;
    create(clinicaId: string, createDto: CreateProfissionalDto): Promise<any>;
    findAll(clinicaId: string): Promise<any>;
    findOne(clinicaId: string, id: string): Promise<any>;
    update(clinicaId: string, id: string, updateDto: Partial<CreateProfissionalDto>): Promise<any>;
    remove(clinicaId: string, id: string): Promise<any>;
}
