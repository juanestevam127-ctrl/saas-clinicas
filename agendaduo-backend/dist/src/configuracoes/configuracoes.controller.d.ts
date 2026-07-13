import { ConfiguracoesService } from './configuracoes.service';
export declare class ConfiguracoesController {
    private readonly configuracoesService;
    constructor(configuracoesService: ConfiguracoesService);
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
