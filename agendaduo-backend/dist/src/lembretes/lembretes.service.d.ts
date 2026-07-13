import { SupabaseService } from '../supabase/supabase.service';
import { HttpService } from '@nestjs/axios';
export declare class LembretesService {
    private readonly supabase;
    private readonly httpService;
    private readonly logger;
    constructor(supabase: SupabaseService, httpService: HttpService);
    processLembretes(): Promise<void>;
    processAniversarios(): Promise<void>;
}
