import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body, user, clinicaId, ip } = req;
    
    return next.handle().pipe(
      tap(async (dadosNovos) => {
        if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
          const userId = user?.sub || 'system';
          if (!clinicaId) return;
          
          const entidade = url.split('/')[1] || 'unknown';
          const acao = method;
          
          await this.prisma.auditoria.create({
            data: {
              clinicaId,
              usuarioId: userId,
              acao,
              entidade,
              entidadeId: dadosNovos?.id || 'unknown',
              dadosAnteriores: (method === 'PATCH' || method === 'PUT') ? { info: 'VER_HISTORICO' } : Prisma.JsonNull,
              dadosNovos: dadosNovos || body,
              ip: ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
            },
          });
        }
      }),
    );
  }
}
