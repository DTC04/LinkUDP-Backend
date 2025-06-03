import { PrismaService } from '../prisma/prisma.service';
import { Booking, BookingStatus } from '@prisma/client';
import { MailerService } from '@nestjs-modules/mailer';
export declare class BookingService {
    private readonly mailerService;
    private readonly prisma;
    constructor(mailerService: MailerService, prisma: PrismaService);
}
export declare class BookingsService {
    private prisma;
    private mailerService;
    constructor(prisma: PrismaService, mailerService: MailerService);
    findStudentBookings(studentProfileId: number, statuses?: BookingStatus | BookingStatus[], upcoming?: boolean, past?: boolean): Promise<Booking[]>;
    createBooking(studentUserId: number, sessionId: number): Promise<Booking>;
    cancelBooking(bookingId: number, profileId: number, profileType: 'student' | 'tutor'): Promise<void>;
    confirmBooking(bookingId: number, tutorProfileId: number): Promise<void>;
    confirmBookingBySession(sessionId: number, tutorProfileId: number): Promise<void>;
    cancelBookingBySession(sessionId: number, tutorProfileId: number, profileType: 'student' | 'tutor'): Promise<void>;
}
