import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const EVOLUTION_API_URL = 'https://evolution-evolution-api.5rqumh.easypanel.host';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';

const headers = {
  apikey: EVOLUTION_API_KEY,
  'Content-Type': 'application/json',
};

function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

// GET /api/whatsapp/reconectar/[instanceName]
export async function GET(req: NextRequest, props: { params: Promise<{ instanceName: string }> }) {
  try {
    const params = await props.params;
    const { instanceName } = params;
    try {
      const response = await axios.get(
        `${EVOLUTION_API_URL}/instance/connect/${instanceName}`,
        { headers }
      );
      const data = response.data;
      const qrcode = data.base64 || data.qrcode?.base64 || null;
      return NextResponse.json({
        instanceName,
        status: data.status || 'connecting',
        qrcode,
      });
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || error.message;
      return err('Erro ao conectar instância: ' + msg);
    }
  } catch (e: any) { return err(e.message, 500); }
}
