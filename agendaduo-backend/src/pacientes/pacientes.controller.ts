import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PacientesService } from './pacientes.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { Tenant } from '../common/decorators/tenant.decorator';

@UseGuards(ClerkAuthGuard)
@Controller('pacientes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Post()
  create(@Tenant() clinicaId: string, @Body() createDto: CreatePacienteDto) {
    return this.pacientesService.create(clinicaId, createDto);
  }

  @Get()
  findAll(@Tenant() clinicaId: string) {
    return this.pacientesService.findAll(clinicaId);
  }

  @Get(':id')
  findOne(@Tenant() clinicaId: string, @Param('id') id: string) {
    return this.pacientesService.findOne(clinicaId, id);
  }

  @Patch(':id')
  update(@Tenant() clinicaId: string, @Param('id') id: string, @Body() updateDto: Partial<CreatePacienteDto>) {
    return this.pacientesService.update(clinicaId, id, updateDto);
  }

  @Delete(':id')
  remove(@Tenant() clinicaId: string, @Param('id') id: string) {
    return this.pacientesService.remove(clinicaId, id);
  }
}
