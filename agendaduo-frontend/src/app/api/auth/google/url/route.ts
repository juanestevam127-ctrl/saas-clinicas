import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// GET /api/auth/google/url
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const profissionalId = searchParams.get('profissionalId');

    if (!profissionalId) {
      return NextResponse.json({ message: 'profissionalId é obrigatório' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
    );

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Garante que recebemos o refresh_token para usar no futuro
      scope: scopes,
      prompt: 'consent', // Garante o envio do refresh_token em todas as conexões
      state: profissionalId, // Passamos o ID do profissional no state para recuperar no callback
    });

    return NextResponse.json({ url });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}
