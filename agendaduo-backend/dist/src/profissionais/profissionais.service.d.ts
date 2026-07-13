import { SupabaseService } from '../supabase/supabase.service';
import { CreateProfissionalDto } from './dto/create-profissional.dto';
export declare class ProfissionaisService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    create(clinicaId: string, data: CreateProfissionalDto): Promise<any>;
    findAll(clinicaId: string): Promise<any>;
    findOne(clinicaId: string, id: string): Promise<any>;
    getConviteInfo(id: string): Promise<any>;
    aceitarConvite(id: string, senha: string): Promise<any>;
    login(email: string, dependencySenha: string): Promise<{
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
    update(clinicaId: string, id: string, updateData: Partial<CreateProfissionalDto>): Promise<any>;
    remove(clinicaId: string, id: string): Promise<any>;
}
