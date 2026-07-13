export declare class CreateConsultaDto {
    pacienteId: string;
    profissionalId: string;
    servicoId: string;
    dataHoraInicio: string;
    dataHoraFim: string;
    status?: string;
    observacoes?: string;
    tipoAtendimento?: string;
    valorCobrado?: number;
    formaPagamento?: string;
}
