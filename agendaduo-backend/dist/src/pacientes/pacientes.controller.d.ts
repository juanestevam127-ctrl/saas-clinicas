import { PacientesService } from './pacientes.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
export declare class PacientesController {
    private readonly pacientesService;
    constructor(pacientesService: PacientesService);
    create(clinicaId: string, createDto: CreatePacienteDto): Promise<any>;
    findAll(clinicaId: string): Promise<any>;
    findOne(clinicaId: string, id: string): Promise<any>;
    update(clinicaId: string, id: string, updateDto: Partial<CreatePacienteDto>): Promise<any>;
    remove(clinicaId: string, id: string): Promise<any>;
}
