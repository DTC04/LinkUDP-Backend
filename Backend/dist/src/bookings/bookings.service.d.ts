import { PrismaService } from '../prisma/prisma.service';
import { Booking, BookingStatus } from '@prisma/client';
export declare class BookingsService {
    private prisma;
    constructor(prisma: PrismaService);
    findStudentBookings(studentProfileId: number, statuses?: BookingStatus | BookingStatus[], upcoming?: boolean, past?: boolean): Promise<Booking[]>;
}
