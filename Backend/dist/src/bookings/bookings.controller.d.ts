import { BookingsService } from './bookings.service';
import { User as UserModel, BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class BookingsController {
    private readonly bookingsService;
    private readonly prisma;
    constructor(bookingsService: BookingsService, prisma: PrismaService);
    getMyBookings(user: UserModel, statuses?: BookingStatus | BookingStatus[], upcoming?: boolean, past?: boolean): Promise<{
        id: number;
        created_at: Date;
        status: import(".prisma/client").$Enums.BookingStatus;
        studentProfileId: number;
        sessionId: number;
    }[]>;
}
