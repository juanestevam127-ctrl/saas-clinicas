import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProfissionaisService } from './profissionais.service';
import { CreateProfissionalDto } from './dto/create-profissional.dto';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { Tenant } from '../common/decorators/tenant.decorator';

@Controller('profissionais')
export class ProfissionaisController {
  constructor(private readonly profissionaisService: ProfissionaisService) {}

  // Rotas Públicas (Sem necessidade de Token do Clerk)
  @Get('convite-info/:id')
  getConviteInfo(@Param('id') id: string) {
    return this.profissionaisService.getConviteInfo(id);
  }

  @Post('aceitar-convite')
  aceitarConvite(@Body() body: { id: string; senha: string }) {
    return this.profissionaisService.aceitarConvite(body.id, body.senha);
  }

  @Post('login')
  login(@Body() body: { email: string; senha: string }) {
    return this.profissionaisService.login(body.email, body.senha);
  }

  // Rotas Protegidas (Exigem autenticação do Clerk)
  @UseGuards(ClerkAuthGuard)
  @Post()
  create(@Tenant() clinicaId: string, @Body() createDto: CreateProfissionalDto) {
    return this.profissionaisService.create(clinicaId, createDto);
  }

  @UseGuards(ClerkAuthGuard)
  @Get()
  findAll(@Tenant() clinicaId: string) {
    return this.profissionaisService.findAll(clinicaId);
  }

  @UseGuards(ClerkAuthGuard)
  @Get(':id')
  findOne(@Tenant() clinicaId: string, @Param('id') id: string) {
    return this.profissionaisService.findOne(clinicaId, id);
  }

  @UseGuards(ClerkAuthGuard)
  @Patch(':id')
  update(@Tenant() clinicaId: string, @Param('id') id: string, @Body() updateDto: Partial<CreateProfissionalDto>) {
    return this.profissionaisService.update(clinicaId, id, updateDto);
  }

  @UseGuards(ClerkAuthGuard)
  @Delete(':id')
  remove(@Tenant() clinicaId: string, @Param('id') id: string) {
    return this.profissionaisService.remove(clinicaId, id);
  }
}
