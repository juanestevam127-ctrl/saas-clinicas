import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreateProfissionalDto {
  @IsString()
  nome: string;

  @IsString()
  @IsOptional()
  especialidade?: string;

  @IsString()
  @IsOptional()
  registroProfissional?: string;

  @IsString()
  @IsOptional()
  fotoUrl?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsInt()
  @IsOptional()
  duracaoPadraoConsulta?: number;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
