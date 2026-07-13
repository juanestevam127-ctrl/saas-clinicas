import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const EVOLUTION_API_URL = 'https://evolution-evolution-api.5rqumh.easypanel.host';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';

const headers = {
  apikey: EVOLUTION_API_KEY,
  'Content-Type': 'application/json',
};

// DELETE /api/whatsapp/desconectar/[instanceName]
export async function DELETE(req: NextRequest, props: { params: Promise<{ instanceName: string }> }) {
  try {
    const params = await props.params;
    const { instanceName } = params;
    try {
      await axios.delete(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, { headers });
    } catch { /* ignora */ }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}
