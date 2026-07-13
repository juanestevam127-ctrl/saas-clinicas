import { HttpService } from '@nestjs/axios';
export declare class WhatsappService {
    private readonly httpService;
    constructor(httpService: HttpService);
    getInstancias(): Promise<never[]>;
    createInstance(instanceName: string): Promise<{
        instanceName: any;
        status: any;
        qrcode: any;
    }>;
    checkConnectionState(instanceName: string): Promise<{
        instanceName: string;
        state: any;
        connectionStatus: any;
    }>;
    logoutInstance(instanceName: string): Promise<{
        success: boolean;
    }>;
    connectInstance(instanceName: string): Promise<{
        instanceName: string;
        status: any;
        qrcode: any;
    }>;
}
