import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateFinanceiroDto {
  @IsString()
  @IsOptional()
  consultaId?: string;

  @IsString()
  @IsOptional()
  pacienteId?: string;

  @IsString()
  @IsOptional()
  profissionalId?: string;

  @IsNumber()
  valor: number;

  @IsString()
  @IsOptional()
  statusPagamento?: string;

  @IsString()
  @IsOptional()
  formaPagamento?: string;

  @IsDateString()
  @IsOptional()
  dataPagamento?: string;

  @IsString()
  @IsOptional()
  observacoes?: string;
}
