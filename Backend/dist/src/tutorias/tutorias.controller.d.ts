import { TutoriasService } from './tutorias.service';
import { CreateTutoriaDto } from './dto/create-tutoria.dto';
import { UpdateTutoriaDto } from './dto/update-tutoria.dto';
import { TutoringSession } from '@prisma/client';
export declare class TutoriasController {
    private readonly tutoriasService;
    constructor(tutoriasService: TutoriasService);
    create(createTutoriaDto: CreateTutoriaDto): Promise<TutoringSession>;
    findAll(ramo?: string, horario?: string, tutorId?: number, status?: string | string[], upcoming?: string, limit?: number): Promise<TutoringSession[]>;
    findOne(id: number): Promise<TutoringSession>;
    update(id: number, updateTutoriaDto: UpdateTutoriaDto): Promise<TutoringSession>;
    remove(id: number): Promise<TutoringSession>;
    contactTutor(sessionId: number, message: string, req: any): Promise<{
        success: boolean;
    }>;
}
