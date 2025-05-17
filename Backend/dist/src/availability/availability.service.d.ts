import { PrismaService } from '../prisma/prisma.service';
export declare class AvailabilityService {
    private prisma;
    constructor(prisma: PrismaService);
    getTutorAvailability(tutorId: number): Promise<{
        day_of_week: import(".prisma/client").$Enums.DayOfWeek;
        start_time: string;
        end_time: string;
    }[]>;
}
