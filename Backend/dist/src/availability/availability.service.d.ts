import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class AvailabilityService {
    private prisma;
    constructor(prisma: PrismaService);
    getTutorAvailability(tutorId: number): Promise<{
        id: number;
        tutorId: number;
        start_time: Date;
        end_time: Date;
        day_of_week: import(".prisma/client").$Enums.DayOfWeek;
    }[]>;
    createAvailabilityBlock(data: Prisma.AvailabilityBlockCreateInput): Promise<{
        id: number;
        tutorId: number;
        start_time: Date;
        end_time: Date;
        day_of_week: import(".prisma/client").$Enums.DayOfWeek;
    }>;
    updateAvailabilityBlock(id: number, data: Prisma.AvailabilityBlockUpdateInput): Promise<{
        id: number;
        tutorId: number;
        start_time: Date;
        end_time: Date;
        day_of_week: import(".prisma/client").$Enums.DayOfWeek;
    }>;
    deleteAvailabilityBlock(id: number): Promise<{
        id: number;
        tutorId: number;
        start_time: Date;
        end_time: Date;
        day_of_week: import(".prisma/client").$Enums.DayOfWeek;
    }>;
}
