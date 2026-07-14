import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getAuthenticatedClient } from '@/lib/google-calendar';
import { google } from 'googleapis';

// GET /api/auth/google/events?profissionalId=xxx&start=xxx&end=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const profissionalId = searchParams.get('profissionalId');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!profissionalId) {
      return NextResponse.json({ message: 'profissionalId é obrigatório' }, { status: 400 });
    }

    const db = getSupabase();
    const authData = await getAuthenticatedClient(profissionalId, db);
    
    if (!authData) {
      // Retorna vazio se não tiver Google Calendar integrado
      return NextResponse.json([]);
    }

    const calendar = google.calendar({ version: 'v3', auth: authData.client });

    const response = await calendar.events.list({
      calendarId: authData.calendarId,
      timeMin: start ? new Date(start).toISOString() : new Date().toISOString(),
      timeMax: end ? new Date(end).toISOString() : undefined,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = (response.data.items || []).map((event: any) => ({
      id: event.id,
      title: event.summary || 'Bloqueado (Google)',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      isGoogleEvent: true,
    }));

    return NextResponse.json(events);
  } catch (e: any) {
    console.error('Erro ao buscar eventos do Google:', e);
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}
