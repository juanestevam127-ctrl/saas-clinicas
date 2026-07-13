import { SupabaseService } from '../supabase/supabase.service';
import { CreateConsultaDto } from './dto/create-consulta.dto';
export declare class ConsultasService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    checkConflict(profissionalId: string, inicio: Date, fim: Date, ignorarId?: string): Promise<void>;
    checkHorariosFuncionamento(clinicaId: string, inicio: Date, fim: Date): Promise<void>;
    create(clinicaId: string, createdBy: string, data: CreateConsultaDto): Promise<any>;
    findAll(clinicaId: string): Promise<any>;
    findOne(clinicaId: string, id: string): Promise<any>;
    update(clinicaId: string, id: string, userId: string, updateData: Partial<CreateConsultaDto>): Promise<any>;
    remove(clinicaId: string, id: string, userId: string): Promise<any>;
}
