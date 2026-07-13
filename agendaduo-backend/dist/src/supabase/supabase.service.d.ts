import { SupabaseClient } from '@supabase/supabase-js';
export declare const TABLES: {
    readonly clinicas: "sistema_clinicas_agenciaduo_clinicas";
    readonly profissionais: "sistema_clinicas_agenciaduo_profissionais";
    readonly horarios: "sistema_clinicas_agenciaduo_horarios_profissionais";
    readonly profissionalServicos: "sistema_clinicas_agenciaduo_profissional_servicos";
    readonly bloqueios: "sistema_clinicas_agenciaduo_bloqueios_agenda";
    readonly pacientes: "sistema_clinicas_agenciaduo_pacientes";
    readonly servicos: "sistema_clinicas_agenciaduo_servicos";
    readonly consultas: "sistema_clinicas_agenciaduo_consultas";
    readonly consultaHistorico: "sistema_clinicas_agenciaduo_consultas_historico";
    readonly lembretesConfig: "sistema_clinicas_agenciaduo_lembretes_config";
    readonly lembretesLog: "sistema_clinicas_agenciaduo_lembretes_log";
    readonly whatsappInstancias: "sistema_clinicas_agenciaduo_whatsapp_instancias";
    readonly financeiro: "sistema_clinicas_agenciaduo_financeiro";
    readonly auditoria: "sistema_clinicas_agenciaduo_auditoria";
};
export declare class SupabaseService {
    private client;
    constructor();
    get db(): SupabaseClient;
    toSnakeCase(obj: any): any;
    toCamelCase(obj: any): any;
}
