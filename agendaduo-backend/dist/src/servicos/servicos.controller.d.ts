import { ServicosService } from './servicos.service';
import { CreateServicoDto } from './dto/create-servico.dto';
export declare class ServicosController {
    private readonly servicosService;
    constructor(servicosService: ServicosService);
    create(clinicaId: string, createDto: CreateServicoDto): Promise<any>;
    findAll(clinicaId: string): Promise<any>;
    findOne(clinicaId: string, id: string): Promise<any>;
    update(clinicaId: string, id: string, updateDto: Partial<CreateServicoDto>): Promise<any>;
    remove(clinicaId: string, id: string): Promise<any>;
}
