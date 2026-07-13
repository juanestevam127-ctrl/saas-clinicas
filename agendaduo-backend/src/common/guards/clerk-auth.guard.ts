import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { clerkClient } from '@clerk/clerk-sdk-node';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // BYPASS TEMPORÁRIO DO CLERK PARA TESTES LOCAIS DO FRONTEND
    request.user = { id: 'mock_user_id', email: 'admin@clinica.com' };
    
    let clinicaId = request.headers['x-clinica-id'];
    if (!clinicaId) {
      clinicaId = '00000000-0000-0000-0000-000000000000';
    }

    request.clinicaId = clinicaId;
    return true;
  }
}
