import { SupabaseService } from '../supabase/supabase.service';
import { CreateServicoDto } from './dto/create-servico.dto';
export declare class ServicosService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    create(clinicaId: string, data: CreateServicoDto): Promise<any>;
    findAll(clinicaId: string): Promise<any>;
    findOne(clinicaId: string, id: string): Promise<any>;
    update(clinicaId: string, id: string, updateData: Partial<CreateServicoDto>): Promise<any>;
    remove(clinicaId: string, id: string): Promise<any>;
}
