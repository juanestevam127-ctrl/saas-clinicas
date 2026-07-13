import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const TABLES = {
  clinicas: 'sistema_clinicas_agenciaduo_clinicas',
  profissionais: 'sistema_clinicas_agenciaduo_profissionais',
  horarios: 'sistema_clinicas_agenciaduo_horarios_profissionais',
  profissionalServicos: 'sistema_clinicas_agenciaduo_profissional_servicos',
  bloqueios: 'sistema_clinicas_agenciaduo_bloqueios_agenda',
  pacientes: 'sistema_clinicas_agenciaduo_pacientes',
  servicos: 'sistema_clinicas_agenciaduo_servicos',
  consultas: 'sistema_clinicas_agenciaduo_consultas',
  consultaHistorico: 'sistema_clinicas_agenciaduo_consultas_historico',
  lembretesConfig: 'sistema_clinicas_agenciaduo_lembretes_config',
  lembretesLog: 'sistema_clinicas_agenciaduo_lembretes_log',
  whatsappInstancias: 'sistema_clinicas_agenciaduo_whatsapp_instancias',
  financeiro: 'sistema_clinicas_agenciaduo_financeiro',
  auditoria: 'sistema_clinicas_agenciaduo_auditoria',
} as const;

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      throw new Error('SUPABASE_URL e SUPABASE_SERVICE_KEY devem estar definidos no .env');
    }

    this.client = createClient(url, key, {
      auth: { persistSession: false },
    });

    console.log('[Supabase] Cliente inicializado para:', url);
  }

  get db(): SupabaseClient {
    return this.client;
  }

  // Utilitário para converter objeto camelCase para snake_case para o banco
  toSnakeCase(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(v => this.toSnakeCase(v));
    
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      newObj[snakeKey] = this.toSnakeCase(obj[key]);
    }
    return newObj;
  }

  // Utilitário para converter objeto snake_case para camelCase para o frontend
  toCamelCase(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(v => this.toCamelCase(v));
    if (obj instanceof Date) return obj;

    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      const camelKey = key.replace(/([-_][a-z])/g, group =>
        group.toUpperCase().replace('-', '').replace('_', '')
      );
      newObj[camelKey] = this.toCamelCase(obj[key]);
    }
    return newObj;
  }
}
