import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService, TABLES } from '../supabase/supabase.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class LembretesService {
  private readonly logger = new Logger(LembretesService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly httpService: HttpService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processLembretes() {
    this.logger.log('Iniciando processamento de lembretes...');

    // Buscar configurações ativas com dados da clínica
    const { data: configs, error: cfgErr } = await this.supabase.db
      .from(TABLES.lembretesConfig)
      .select(`*, clinica:${TABLES.clinicas}(nome, n8n_webhook_url, endereco)`)
      .eq('ativo', true);

    if (cfgErr || !configs?.length) return;

    for (const config of configs) {

      let hours = 24;
      if (config.antecedencia === '2h') hours = 2;
      if (config.antecedencia === '1h') hours = 1;
      // Handle custom minutes/hours/days if they were saved like "30m", "3h", "2d"
      if (config.antecedencia.endsWith('m')) hours = parseInt(config.antecedencia) / 60;
      else if (config.antecedencia.endsWith('h')) hours = parseInt(config.antecedencia);
      else if (config.antecedencia.endsWith('d')) hours = parseInt(config.antecedencia) * 24;

      const targetTime = new Date();
      targetTime.setTime(targetTime.getTime() + hours * 3600 * 1000);
      
      // Janela de tolerância de 2 minutos para trás, para garantir que só dispare no momento exato
      // e não dispare lembretes de 24h para consultas criadas para daqui a 5 minutos.
      const windowStart = new Date(targetTime.getTime() - 2 * 60000);

      const { data: consultas } = await this.supabase.db
        .from(TABLES.consultas)
        .select(`*, paciente:${TABLES.pacientes}(nome,telefone), profissional:${TABLES.profissionais}(nome,bio), servico:${TABLES.servicos}(nome)`)
        .eq('clinica_id', config.clinica_id)
        .in('status', ['agendado', 'confirmado'])
        .gte('data_hora_inicio', windowStart.toISOString())
        .lte('data_hora_inicio', targetTime.toISOString());

      for (const consulta of (consultas ?? [])) {
        const { data: sent } = await this.supabase.db
          .from(TABLES.lembretesLog)
          .select('id, status')
          .eq('consulta_id', consulta.id)
          .eq('antecedencia', config.antecedencia)
          .single();

        if (sent?.status === 'enviado') continue;

        try {
          let instName = null;
          if (consulta.profissional?.bio) {
            try {
              const bio = JSON.parse(consulta.profissional.bio);
              instName = bio.whatsappInstanceName || null;
            } catch(e){}
          }

          const payload = {
            evento: 'lembrete_consulta',
            clinica_id: config.clinica_id,
            clinica_nome: config.clinica.nome,
            paciente_nome: consulta.paciente?.nome,
            paciente_telefone: consulta.paciente?.telefone,
            profissional_nome: consulta.profissional?.nome,
            instancia_whatsapp: instName,
            servico: consulta.servico?.nome,
            data_hora: consulta.data_hora_inicio,
            antecedencia: config.antecedencia,
            tipo_atendimento: consulta.tipo_atendimento || 'presencial',
            endereco_clinica: (!consulta.tipo_atendimento || consulta.tipo_atendimento === 'presencial') ? config.clinica.endereco : null,
          };

          const webhookUrl = 'https://criadordigital-n8n-webhook.5rqumh.easypanel.host/webhook/lembretes-clinicas';
          await firstValueFrom(this.httpService.post(webhookUrl, payload));

          await this.supabase.db.from(TABLES.lembretesLog).insert({
            consulta_id: consulta.id,
            antecedencia: config.antecedencia,
            status: 'enviado',
          });
        } catch (error: any) {
          this.logger.error(`Erro ao enviar lembrete (Consulta ${consulta.id}): ${error.message}`);
          await this.supabase.db.from(TABLES.lembretesLog).insert({
            consulta_id: consulta.id,
            antecedencia: config.antecedencia,
            status: 'falhou',
          });
        }
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processAniversarios() {
    // Only run if the time matches the clinic's configured time
    const now = new Date();
    // Ajusta para o timezone do Brasil (GMT-3) simplificado para o cron
    const brTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    const hh = String(brTime.getHours()).padStart(2, '0');
    const mm = String(brTime.getMinutes()).padStart(2, '0');
    const currentHourMin = `${hh}:${mm}`;
    const todayMMDD = String(brTime.getMonth() + 1).padStart(2, '0') + '-' + String(brTime.getDate()).padStart(2, '0');

    const { data: clinicas } = await this.supabase.db
      .from(TABLES.clinicas)
      .select('id, nome, lembrete_aniversario_horario')
      .eq('lembrete_aniversario_ativo', true)
      .eq('lembrete_aniversario_horario', currentHourMin);

    if (!clinicas || clinicas.length === 0) return;

    for (const clinica of clinicas) {
      this.logger.log(`Processando aniversários para clínica ${clinica.nome} às ${currentHourMin}`);

      // Obter pacientes com data_nascimento
      const { data: pacientes } = await this.supabase.db
        .from(TABLES.pacientes)
        .select('id, nome, telefone, data_nascimento')
        .eq('clinica_id', clinica.id)
        .not('data_nascimento', 'is', null);

      const aniversariantes = (pacientes || []).filter(p => {
        if (!p.data_nascimento) return false;
        // data_nascimento format: YYYY-MM-DD
        return p.data_nascimento.substring(5, 10) === todayMMDD;
      });

      if (aniversariantes.length === 0) continue;

      // Buscar a instância do WhatsApp do admin da clínica (ou qualquer um válido)
      // Como 'role' está no bio (JSON), vamos buscar os profissionais e achar o primeiro com whatsappInstanceName
      const { data: profissionais } = await this.supabase.db
        .from(TABLES.profissionais)
        .select('bio')
        .eq('clinica_id', clinica.id);

      let instName = null;
      if (profissionais && profissionais.length > 0) {
        for (const p of profissionais) {
          if (p.bio) {
            try {
              const bio = JSON.parse(p.bio);
              if (bio.whatsappInstanceName) {
                instName = bio.whatsappInstanceName;
                break;
              }
            } catch(e) {}
          }
        }
      }

      for (const paciente of aniversariantes) {
        try {
          const payload = {
            evento: 'lembrete_aniversario',
            clinica_id: clinica.id,
            clinica_nome: clinica.nome,
            paciente_nome: paciente.nome,
            paciente_telefone: paciente.telefone,
            instancia_whatsapp: instName,
            data_aniversario: paciente.data_nascimento,
          };

          const webhookUrl = process.env.DEFAULT_N8N_WEBHOOK_ANIVERSARIO_URL || 'https://criadordigital-n8n-webhook.5rqumh.easypanel.host/webhook/lembretes-aniversario-clinicas';
          await firstValueFrom(this.httpService.post(webhookUrl, payload));
          this.logger.log(`Lembrete de aniversário enviado para ${paciente.nome}`);
        } catch (error: any) {
          this.logger.error(`Erro ao enviar aniversário para ${paciente.nome}: ${error.message}`);
        }
      }
    }
  }
}
