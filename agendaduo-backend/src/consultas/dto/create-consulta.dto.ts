import { IsString, IsDateString, IsOptional, IsNumber } from 'class-validator';

export class CreateConsultaDto {
  @IsString()
  pacienteId: string;

  @IsString()
  profissionalId: string;

  @IsString()
  servicoId: string;

  @IsDateString()
  dataHoraInicio: string;

  @IsDateString()
  dataHoraFim: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  observacoes?: string;

  @IsString()
  @IsOptional()
  tipoAtendimento?: string;

  @IsNumber()
  @IsOptional()
  valorCobrado?: number;

  @IsString()
  @IsOptional()
  formaPagamento?: string;
}
