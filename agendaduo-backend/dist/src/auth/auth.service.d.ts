import { SupabaseService } from '../supabase/supabase.service';
export declare class AuthService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    register(email: string, senha: string): Promise<{
        message: string;
        clinicaId: any;
        profissionalId: any;
        role: string;
        nome: string;
        trialEndsAt: Date;
    }>;
}
