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

// POST /api/whatsapp/conectar
export async function POST(req: NextRequest) {
  try {
    const { instanceName } = await req.json();
    if (!instanceName) return err('Nome da instância obrigatório');

    // Tenta deletar se já existir
    try {
      await axios.delete(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, { headers });
    } catch { /* ignora */ }

    try {
      const response = await axios.post(
        `${EVOLUTION_API_URL}/instance/create`,
        { instanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS' },
        { headers }
      );
      const data = response.data;
      const resData = Array.isArray(data) ? data[0] : data;

      return NextResponse.json({
        instanceName: resData.instance?.instanceName ?? instanceName,
        status: resData.instance?.status ?? 'connecting',
        qrcode: resData.qrcode?.base64 ?? null,
        hash: resData.hash ?? null,
      });
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || error.message;
      return err('Erro ao criar instância: ' + msg);
    }
  } catch (e: any) { return err(e.message, 500); }
}
