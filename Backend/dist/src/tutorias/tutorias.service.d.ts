import { PrismaService } from '../prisma/prisma.service';
import { CreateTutoriaDto } from './dto/create-tutoria.dto';
import { UpdateTutoriaDto } from './dto/update-tutoria.dto';
import { TutoringSession } from '@prisma/client';
import { MailerService } from '@nestjs-modules/mailer';
export declare class TutoriasService {
    private prisma;
    private readonly mailerService;
    private readonly logger;
    constructor(prisma: PrismaService, mailerService: MailerService);
    create(createTutoriaDto: CreateTutoriaDto): Promise<TutoringSession>;
    findAll(ramo?: string, horario?: string, tutorId?: number, status?: string | string[], upcoming?: boolean, limit?: number): Promise<TutoringSession[]>;
    findOne(id: number): Promise<TutoringSession | null>;
    update(id: number, updateTutoriaDto: UpdateTutoriaDto): Promise<TutoringSession>;
    remove(id: number): Promise<TutoringSession>;
    contactTutor(sessionId: number, studentUserId: number, message: string): Promise<void>;
}
