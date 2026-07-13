import { WhatsappService } from './whatsapp.service';
export declare class WhatsappController {
    private readonly whatsappService;
    constructor(whatsappService: WhatsappService);
    getInstancias(): Promise<never[]>;
    createInstance(instanceName: string): Promise<{
        instanceName: any;
        status: any;
        qrcode: any;
    }>;
    checkStatus(instanceName: string): Promise<{
        instanceName: string;
        state: any;
        connectionStatus: any;
    }>;
    logout(instanceName: string): Promise<{
        success: boolean;
    }>;
    reconnect(instanceName: string): Promise<{
        instanceName: string;
        status: any;
        qrcode: any;
    }>;
}
