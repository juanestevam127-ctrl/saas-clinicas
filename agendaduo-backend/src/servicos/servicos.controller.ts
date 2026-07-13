import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ServicosService } from './servicos.service';
import { CreateServicoDto } from './dto/create-servico.dto';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { Tenant } from '../common/decorators/tenant.decorator';

@UseGuards(ClerkAuthGuard)
@Controller('servicos')
export class ServicosController {
  constructor(private readonly servicosService: ServicosService) {}

  @Post()
  create(@Tenant() clinicaId: string, @Body() createDto: CreateServicoDto) {
    return this.servicosService.create(clinicaId, createDto);
  }

  @Get()
  findAll(@Tenant() clinicaId: string) {
    return this.servicosService.findAll(clinicaId);
  }

  @Get(':id')
  findOne(@Tenant() clinicaId: string, @Param('id') id: string) {
    return this.servicosService.findOne(clinicaId, id);
  }

  @Patch(':id')
  update(@Tenant() clinicaId: string, @Param('id') id: string, @Body() updateDto: Partial<CreateServicoDto>) {
    return this.servicosService.update(clinicaId, id, updateDto);
  }

  @Delete(':id')
  remove(@Tenant() clinicaId: string, @Param('id') id: string) {
    return this.servicosService.remove(clinicaId, id);
  }
}
