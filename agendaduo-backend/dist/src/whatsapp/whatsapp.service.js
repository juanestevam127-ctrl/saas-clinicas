"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const EVOLUTION_API_URL = 'https://evolution-evolution-api.5rqumh.easypanel.host';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const headers = {
    apikey: EVOLUTION_API_KEY,
    'Content-Type': 'application/json',
};
let WhatsappService = class WhatsappService {
    httpService;
    constructor(httpService) {
        this.httpService = httpService;
    }
    async getInstancias() {
        return [];
    }
    async createInstance(instanceName) {
        try {
            await (0, rxjs_1.firstValueFrom)(this.httpService.delete(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, { headers }));
        }
        catch { }
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${EVOLUTION_API_URL}/instance/create`, { instanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS' }, { headers })).catch((error) => {
            const msg = error.response?.data?.message || error.response?.data?.error || error.message;
            throw new common_1.BadRequestException('Erro ao criar instância: ' + msg);
        });
        const data = response.data;
        return {
            instanceName: data.instance?.instanceName ?? instanceName,
            status: data.instance?.status ?? 'connecting',
            qrcode: data.qrcode?.base64 ?? null,
        };
    }
    async checkConnectionState(instanceName) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, { headers }));
            const state = response.data?.instance?.state || 'close';
            return { instanceName, state, connectionStatus: state };
        }
        catch (error) {
            throw new common_1.BadRequestException('Erro ao checar status: ' + error.message);
        }
    }
    async logoutInstance(instanceName) {
        try {
            await (0, rxjs_1.firstValueFrom)(this.httpService.delete(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, { headers }));
        }
        catch { }
        return { success: true };
    }
    async connectInstance(instanceName) {
        const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, { headers })).catch((error) => {
            const msg = error.response?.data?.message || error.response?.data?.error || error.message;
            throw new common_1.BadRequestException('Erro ao conectar instância: ' + msg);
        });
        const data = response.data;
        const qrcode = data.base64 || data.qrcode?.base64 || null;
        return {
            instanceName,
            status: data.status || 'connecting',
            qrcode,
        };
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map