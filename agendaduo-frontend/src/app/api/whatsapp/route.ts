import { NextRequest, NextResponse } from 'next/server';

// GET /api/whatsapp
export async function GET(req: NextRequest) {
  // Lista instâncias — frontend usa localStorage, este endpoint é auxiliar
  return NextResponse.json([]);
}
