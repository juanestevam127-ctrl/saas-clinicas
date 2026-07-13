import { Controller, Post, Get, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';

@UseGuards(ClerkAuthGuard)
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get()
  getInstancias() {
    return this.whatsappService.getInstancias();
  }

  @Post('conectar')
  createInstance(@Body('instanceName') instanceName: string) {
    return this.whatsappService.createInstance(instanceName);
  }

  @Get('status/:instanceName')
  checkStatus(@Param('instanceName') instanceName: string) {
    return this.whatsappService.checkConnectionState(instanceName);
  }

  @Delete('desconectar/:instanceName')
  logout(@Param('instanceName') instanceName: string) {
    return this.whatsappService.logoutInstance(instanceName);
  }

  @Get('reconectar/:instanceName')
  reconnect(@Param('instanceName') instanceName: string) {
    return this.whatsappService.connectInstance(instanceName);
  }
}
