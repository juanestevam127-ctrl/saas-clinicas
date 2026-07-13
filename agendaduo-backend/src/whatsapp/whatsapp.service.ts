import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const EVOLUTION_API_URL = 'https://evolution-evolution-api.5rqumh.easypanel.host';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';

const headers = {
  apikey: EVOLUTION_API_KEY,
  'Content-Type': 'application/json',
};

@Injectable()
export class WhatsappService {
  constructor(private readonly httpService: HttpService) {}

  // Lista instâncias — frontend usa localStorage, este endpoint é auxiliar
  async getInstancias() {
    return [];
  }

  // Cria instância na Evolution API e retorna QR Code
  async createInstance(instanceName: string) {
    // Tenta deletar se já existir
    try {
      await firstValueFrom(
        this.httpService.delete(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, { headers }),
      );
    } catch { /* ignora */ }

    const response = await firstValueFrom(
      this.httpService.post(
        `${EVOLUTION_API_URL}/instance/create`,
        { instanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS' },
        { headers },
      ),
    ).catch((error: any) => {
      const msg = error.response?.data?.message || error.response?.data?.error || error.message;
      throw new BadRequestException('Erro ao criar instância: ' + msg);
    });

    const data = response.data;
    return {
      instanceName: data.instance?.instanceName ?? instanceName,
      status: data.instance?.status ?? 'connecting',
      qrcode: data.qrcode?.base64 ?? null,
    };
  }

  // Verifica status ao vivo na Evolution API
  async checkConnectionState(instanceName: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`,
          { headers },
        ),
      );
      const state = response.data?.instance?.state || 'close';
      return { instanceName, state, connectionStatus: state };
    } catch (error: any) {
      throw new BadRequestException('Erro ao checar status: ' + error.message);
    }
  }

  // Remove instância da Evolution API
  async logoutInstance(instanceName: string) {
    try {
      await firstValueFrom(
        this.httpService.delete(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, { headers }),
      );
    } catch { /* ignora */ }
    return { success: true };
  }

  // Obtém QR Code de uma instância já existente que está desconectada
  async connectInstance(instanceName: string) {
    const response = await firstValueFrom(
      this.httpService.get(
        `${EVOLUTION_API_URL}/instance/connect/${instanceName}`,
        { headers },
      ),
    ).catch((error: any) => {
      const msg = error.response?.data?.message || error.response?.data?.error || error.message;
      throw new BadRequestException('Erro ao conectar instância: ' + msg);
    });

    const data = response.data;
    const qrcode = data.base64 || data.qrcode?.base64 || null;

    return {
      instanceName,
      status: data.status || 'connecting',
      qrcode,
    };
  }
}
