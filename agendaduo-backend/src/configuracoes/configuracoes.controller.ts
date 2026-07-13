import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ConfiguracoesService } from './configuracoes.service';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { Tenant } from '../common/decorators/tenant.decorator';

@Controller('configuracoes')
@UseGuards(ClerkAuthGuard)
export class ConfiguracoesController {
  constructor(private readonly configuracoesService: ConfiguracoesService) {}

  @Get()
  async getConfiguracoes(@Tenant() clinicaId: string) {
    return this.configuracoesService.getConfiguracoes(clinicaId);
  }

  @Put()
  async updateConfiguracoes(
    @Tenant() clinicaId: string,
    @Body() data: any
  ) {
    console.log('Recebido PUT /configuracoes com clinicaId:', clinicaId);
    return this.configuracoesService.updateConfiguracoes(clinicaId, data);
  }
}
