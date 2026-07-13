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

// GET /api/whatsapp/status/[instanceName]
export async function GET(req: NextRequest, props: { params: Promise<{ instanceName: string }> }) {
  try {
    const params = await props.params;
    const { instanceName } = params;
    try {
      const response = await axios.get(
        `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`,
        { headers }
      );
      const state = response.data?.instance?.state || 'close';
      return NextResponse.json({ instanceName, state, connectionStatus: state });
    } catch (error: any) {
      return err('Erro ao checar status: ' + error.message);
    }
  } catch (e: any) { return err(e.message, 500); }
}
