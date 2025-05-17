import { PrismaService } from '../prisma/prisma.service';
import { CreateTutoriaDto } from './dto/create-tutoria.dto';
import { UpdateTutoriaDto } from './dto/update-tutoria.dto';
import { TutoringSession } from '@prisma/client';
export declare class TutoriasService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createTutoriaDto: CreateTutoriaDto): Promise<TutoringSession>;
    findAll(ramo?: string, horario?: string): Promise<TutoringSession[]>;
    findOne(id: number): Promise<TutoringSession | null>;
    update(id: number, updateTutoriaDto: UpdateTutoriaDto): Promise<TutoringSession>;
    remove(id: number): Promise<TutoringSession>;
}
