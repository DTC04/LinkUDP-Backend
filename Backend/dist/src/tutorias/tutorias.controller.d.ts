import { TutoriasService } from './tutorias.service';
import { CreateTutoriaDto } from './dto/create-tutoria.dto';
import { UpdateTutoriaDto } from './dto/update-tutoria.dto';
import { TutoringSession } from '@prisma/client';
export declare class TutoriasController {
    private readonly tutoriasService;
    constructor(tutoriasService: TutoriasService);
    create(createTutoriaDto: CreateTutoriaDto): Promise<TutoringSession>;
    findAll(ramo?: string, horario?: string, tutorId?: number, status?: string | string[], upcoming?: string, limit?: number): Promise<TutoringSession[]>;
    getRecommended(user: {
        id: number;
    }): Promise<{
        id: number;
        created_at: Date;
        updated_at: Date;
        tutorId: number;
        courseId: number;
        title: string;
        description: string;
        date: Date;
        start_time: Date;
        end_time: Date;
        status: import(".prisma/client").$Enums.BookingStatus;
        location: string | null;
        notes: string | null;
    }[]>;
    findOne(id: number): Promise<TutoringSession>;
    update(id: number, updateTutoriaDto: UpdateTutoriaDto): Promise<TutoringSession>;
    remove(id: number): Promise<TutoringSession>;
    contactTutor(sessionId: number, message: string, req: any): Promise<{
        success: boolean;
    }>;
}
