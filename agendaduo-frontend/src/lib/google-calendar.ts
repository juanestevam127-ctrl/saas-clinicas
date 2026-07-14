import { google } from 'googleapis';
import { getSupabase, TABLES } from './supabase';

export function getGoogleOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
  );
}

// Retorna um cliente autenticado com os tokens do profissional. Atualiza e salva se necessário.
export async function getAuthenticatedClient(profissionalId: string, db: any) {
  const { data: prof, error } = await db
    .from(TABLES.profissionais as any)
    .select('id, google_access_token, google_refresh_token, google_calendar_id')
    .eq('id', profissionalId)
    .single();

  if (error || !prof || !prof.google_access_token) {
    return null; // Não integrado
  }

  const oauth2Client = getGoogleOAuthClient();
  oauth2Client.setCredentials({
    access_token: prof.google_access_token,
    refresh_token: prof.google_refresh_token,
  });

  // Escutar atualizações automáticas de tokens expirados
  oauth2Client.on('tokens', async (newTokens) => {
    const updatePayload: any = {
      google_access_token: newTokens.access_token,
    };
    if (newTokens.refresh_token) {
      updatePayload.google_refresh_token = newTokens.refresh_token;
    }
    await db.from(TABLES.profissionais as any).update(updatePayload).eq('id', profissionalId);
  });

  return {
    client: oauth2Client,
    calendarId: prof.google_calendar_id || 'primary',
  };
}

// Cria ou atualiza uma consulta no Google Calendar
export async function syncEventToGoogle(consultaId: string) {
  try {
    const db = getSupabase();
    
    // Obter dados completos da consulta
    const { data: consulta, error } = await db
      .from(TABLES.consultas as any)
      .select('*, paciente:sistema_clinicas_agenciaduo_pacientes(nome, telefone), servico:sistema_clinicas_agenciaduo_servicos(nome)')
      .eq('id', consultaId)
      .single();

    if (error || !consulta) return;

    const authData = await getAuthenticatedClient(consulta.profissional_id, db);
    if (!authData) return;

    const calendar = google.calendar({ version: 'v3', auth: authData.client });

    const eventPayload: any = {
      summary: `Consulta: ${consulta.paciente?.nome || 'Paciente'}`,
      description: `Serviço: ${consulta.servico?.nome || 'Consulta'}\nTipo: ${consulta.tipo_atendimento || 'presencial'}\nObservações: ${consulta.observacoes || ''}`,
      start: {
        dateTime: new Date(consulta.data_hora_inicio).toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: new Date(consulta.data_hora_fim).toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
    };

    if (consulta.google_event_id) {
      // Atualizar existente
      try {
        await calendar.events.update({
          calendarId: authData.calendarId,
          eventId: consulta.google_event_id,
          requestBody: eventPayload,
        });
      } catch (err: any) {
        if (err.code === 404) {
          // Se não achar o evento (foi excluído no Google), criar um novo
          const newEvent = await calendar.events.insert({
            calendarId: authData.calendarId,
            requestBody: eventPayload,
          });
          await db.from(TABLES.consultas as any).update({ google_event_id: newEvent.data.id }).eq('id', consultaId);
        }
      }
    } else {
      // Criar novo
      const newEvent = await calendar.events.insert({
        calendarId: authData.calendarId,
        requestBody: eventPayload,
      });
      await db.from(TABLES.consultas as any).update({ google_event_id: newEvent.data.id }).eq('id', consultaId);
    }
  } catch (err) {
    console.error('Erro ao sincronizar consulta com Google Calendar:', err);
  }
}

// Remove consulta do Google Calendar
export async function deleteEventFromGoogle(profissionalId: string, googleEventId: string | null) {
  if (!googleEventId) return;
  try {
    const db = getSupabase();
    const authData = await getAuthenticatedClient(profissionalId, db);
    if (!authData) return;

    const calendar = google.calendar({ version: 'v3', auth: authData.client });
    await calendar.events.delete({
      calendarId: authData.calendarId,
      eventId: googleEventId,
    });
  } catch (err) {
    console.error('Erro ao excluir consulta do Google Calendar:', err);
  }
}
