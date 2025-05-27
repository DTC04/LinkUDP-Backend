import { PrismaService } from '../prisma/prisma.service';
import { Course } from '@prisma/client';
export declare class CoursesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<Course[]>;
}
