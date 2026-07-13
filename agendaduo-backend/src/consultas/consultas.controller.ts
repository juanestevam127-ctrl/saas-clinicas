import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ConsultasService } from './consultas.service';
import { CreateConsultaDto } from './dto/create-consulta.dto';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { Tenant } from '../common/decorators/tenant.decorator';

@UseGuards(ClerkAuthGuard)
@Controller('consultas')
export class ConsultasController {
  constructor(private readonly consultasService: ConsultasService) {}

  @Post()
  create(@Tenant() clinicaId: string, @Body() createDto: CreateConsultaDto, @Req() req: any) {
    // Pegando ID do usuário do Clerk do token para logs
    const userId = req.user?.sub || 'system';
    return this.consultasService.create(clinicaId, userId, createDto);
  }

  @Get()
  findAll(@Tenant() clinicaId: string) {
    return this.consultasService.findAll(clinicaId);
  }

  @Get(':id')
  findOne(@Tenant() clinicaId: string, @Param('id') id: string) {
    return this.consultasService.findOne(clinicaId, id);
  }

  @Patch(':id')
  update(@Tenant() clinicaId: string, @Param('id') id: string, @Body() updateDto: Partial<CreateConsultaDto>, @Req() req: any) {
    const userId = req.user?.sub || 'system';
    return this.consultasService.update(clinicaId, id, userId, updateDto);
  }

  @Delete(':id')
  remove(@Tenant() clinicaId: string, @Param('id') id: string, @Req() req: any) {
    const userId = req.user?.sub || 'system';
    return this.consultasService.remove(clinicaId, id, userId);
  }
}
