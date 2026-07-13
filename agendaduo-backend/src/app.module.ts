import 'dotenv/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { SupabaseModule } from './supabase/supabase.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { ProfissionaisModule } from './profissionais/profissionais.module';
import { PacientesModule } from './pacientes/pacientes.module';
import { ServicosModule } from './servicos/servicos.module';
import { ConsultasModule } from './consultas/consultas.module';
import { FinanceiroModule } from './financeiro/financeiro.module';
import { LembretesModule } from './lembretes/lembretes.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { ConfiguracoesModule } from './configuracoes/configuracoes.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SupabaseModule,      // Global — disponível em todos os módulos
    CommonModule,
    AuthModule,
    TenantsModule,
    ProfissionaisModule,
    PacientesModule,
    ServicosModule,
    ConsultasModule,
    FinanceiroModule,
    LembretesModule,
    WhatsappModule,
    AuditoriaModule,
    ConfiguracoesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
