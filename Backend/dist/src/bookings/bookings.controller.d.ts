import { BookingsService } from './bookings.service';
import { User as UserModel, BookingStatus, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export declare class BookingsController {
    private readonly bookingsService;
    private readonly prisma;
    constructor(bookingsService: BookingsService, prisma: PrismaService);
    cancelBooking(user: UserModel, bookingId: string): Promise<void>;
    bookTutoringSession(user: User, sessionId: string): Promise<{
        id: number;
        created_at: Date;
        sessionId: number;
        studentProfileId: number;
        status: import(".prisma/client").$Enums.BookingStatus;
    }>;
    getMyBookings(user: UserModel, statuses?: BookingStatus | BookingStatus[], upcoming?: boolean, past?: boolean): Promise<{
        id: number;
        created_at: Date;
        sessionId: number;
        studentProfileId: number;
        status: import(".prisma/client").$Enums.BookingStatus;
    }[]>;
    confirmBooking(id: string, req: any): Promise<{
        message: string;
    }>;
    confirmBookingBySession(sessionId: string, user: UserModel): Promise<{
        message: string;
    }>;
    cancelBookingBySession(sessionId: string, user: UserModel): Promise<void>;
}
