import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { FinanceiroService } from './financeiro.service';
import { CreateFinanceiroDto } from './dto/create-financeiro.dto';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { Tenant } from '../common/decorators/tenant.decorator';

@UseGuards(ClerkAuthGuard)
@Controller('financeiro')
export class FinanceiroController {
  constructor(private readonly financeiroService: FinanceiroService) {}

  @Post()
  create(@Tenant() clinicaId: string, @Body() createDto: CreateFinanceiroDto) {
    return this.financeiroService.create(clinicaId, createDto);
  }

  @Get()
  findAll(@Tenant() clinicaId: string) {
    return this.financeiroService.findAll(clinicaId);
  }

  @Get(':id')
  findOne(@Tenant() clinicaId: string, @Param('id') id: string) {
    return this.financeiroService.findOne(clinicaId, id);
  }

  @Patch(':id')
  update(@Tenant() clinicaId: string, @Param('id') id: string, @Body() updateDto: Partial<CreateFinanceiroDto>) {
    return this.financeiroService.update(clinicaId, id, updateDto);
  }

  @Delete(':id')
  remove(@Tenant() clinicaId: string, @Param('id') id: string) {
    return this.financeiroService.remove(clinicaId, id);
  }
}
