import { SupabaseService } from '../supabase/supabase.service';
export declare class ConfiguracoesService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    getConfiguracoes(clinicaId: string): Promise<{
        clinica: any;
        lembretes: {
            id: any;
            antecedencia: any;
            ativo: any;
        }[];
    }>;
    updateConfiguracoes(clinicaId: string, data: any): Promise<{
        success: boolean;
    }>;
}
