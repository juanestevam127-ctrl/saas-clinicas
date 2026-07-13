import { IsString, IsOptional, IsInt, IsNumber, IsBoolean } from 'class-validator';

export class CreateServicoDto {
  @IsString()
  nome: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsInt()
  @IsOptional()
  duracaoMinutos?: number;

  @IsNumber()
  valorPadrao: number;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
