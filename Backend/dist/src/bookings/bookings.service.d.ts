import { PrismaService } from '../prisma/prisma.service';
import { Booking, BookingStatus } from '@prisma/client';
export declare class BookingsService {
    private prisma;
    constructor(prisma: PrismaService);
    findStudentBookings(studentProfileId: number, statuses?: BookingStatus | BookingStatus[], upcoming?: boolean, past?: boolean): Promise<Booking[]>;
    createBooking(studentUserId: number, sessionId: number): Promise<Booking>;
    cancelBooking(bookingId: number, profileId: number, profileType: 'student' | 'tutor'): Promise<void>;
    confirmBooking(bookingId: number, tutorProfileId: number): Promise<void>;
    confirmBookingBySession(sessionId: number, tutorProfileId: number): Promise<void>;
    cancelBookingBySession(sessionId: number, tutorProfileId: number, profileType: 'student' | 'tutor'): Promise<void>;
}
