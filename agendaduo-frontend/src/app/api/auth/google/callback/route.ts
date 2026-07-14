import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, TABLES } from '@/lib/supabase';
import { google } from 'googleapis';

// GET /api/auth/google/callback
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');
    const profissionalId = searchParams.get('state'); // O state contém o profissionalId

    const redirectUrl = new URL('/app/agenda', req.url);

    if (errorParam) {
      redirectUrl.searchParams.set('google_status', 'error');
      redirectUrl.searchParams.set('error_message', errorParam);
      return NextResponse.redirect(redirectUrl);
    }

    if (!code || !profissionalId) {
      redirectUrl.searchParams.set('google_status', 'invalid');
      return NextResponse.redirect(redirectUrl);
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
    );

    // Trocar o código de autorização pelos tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Obter o ID do calendário principal (primary)
    let calendarId = 'primary';
    try {
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const primaryCal = await calendar.calendars.get({ calendarId: 'primary' });
      calendarId = primaryCal.data.id || 'primary';
    } catch (calErr) {
      console.error('Erro ao buscar ID da agenda primária:', calErr);
    }

    // Salvar os tokens no Supabase para o profissional correspondente
    const db = getSupabase();
    
    // Para garantir que o refresh_token não seja apagado se for nulo nesta requisição
    const updatePayload: any = {
      google_access_token: tokens.access_token,
      google_calendar_id: calendarId,
    };
    
    if (tokens.refresh_token) {
      updatePayload.google_refresh_token = tokens.refresh_token;
    }

    const { error: dbError } = await db
      .from(TABLES.profissionais as any)
      .update(updatePayload)
      .eq('id', profissionalId);

    if (dbError) {
      redirectUrl.searchParams.set('google_status', 'db_error');
      return NextResponse.redirect(redirectUrl);
    }

    redirectUrl.searchParams.set('google_status', 'success');
    return NextResponse.redirect(redirectUrl);
  } catch (e: any) {
    console.error('Erro no Google Callback:', e);
    const redirectUrl = new URL('/app/agenda', req.url);
    redirectUrl.searchParams.set('google_status', 'server_error');
    return NextResponse.redirect(redirectUrl);
  }
}
