import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(body: any): Promise<{
        message: string;
        clinicaId: any;
        profissionalId: any;
        role: string;
        nome: string;
        trialEndsAt: Date;
    }>;
}
