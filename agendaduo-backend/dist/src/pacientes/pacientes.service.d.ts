import { SupabaseService } from '../supabase/supabase.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
export declare class PacientesService {
    private readonly supabase;
    private readonly algorithm;
    private readonly key;
    constructor(supabase: SupabaseService);
    private encrypt;
    private decrypt;
    create(clinicaId: string, data: CreatePacienteDto): Promise<any>;
    findAll(clinicaId: string): Promise<any>;
    findOne(clinicaId: string, id: string): Promise<any>;
    update(clinicaId: string, id: string, updateData: Partial<CreatePacienteDto>): Promise<any>;
    remove(clinicaId: string, id: string): Promise<any>;
}
