import { createClient } from '@supabase/supabase-js';

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
  prontuariosEvolucoes: 'sistema_clinicas_agenciaduo_prontuarios_evolucoes',
  prontuariosArquivos: 'sistema_clinicas_agenciaduo_prontuarios_arquivos',
} as const;

let _client: any = null;

export function getSupabase() {
  if (!_client) {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_KEY!;
    if (!url || !key) throw new Error('SUPABASE_URL e SUPABASE_SERVICE_KEY não definidos');
    _client = createClient<any, any>(url, key, { auth: { persistSession: false } });
  }
  return _client;
}

export function toSnakeCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  const newObj: any = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);
    newObj[snakeKey] = toSnakeCase(obj[key]);
  }
  return newObj;
}

export function toCamelCase(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj instanceof Date) return obj;
  const newObj: any = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/([-_][a-z])/g, g => g.toUpperCase().replace('-', '').replace('_', ''));
    newObj[camelKey] = toCamelCase(obj[key]);
  }
  return newObj;
}
