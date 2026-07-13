import { ConsultasService } from './consultas.service';
import { CreateConsultaDto } from './dto/create-consulta.dto';
export declare class ConsultasController {
    private readonly consultasService;
    constructor(consultasService: ConsultasService);
    create(clinicaId: string, createDto: CreateConsultaDto, req: any): Promise<any>;
    findAll(clinicaId: string): Promise<any>;
    findOne(clinicaId: string, id: string): Promise<any>;
    update(clinicaId: string, id: string, updateDto: Partial<CreateConsultaDto>, req: any): Promise<any>;
    remove(clinicaId: string, id: string, req: any): Promise<any>;
}
