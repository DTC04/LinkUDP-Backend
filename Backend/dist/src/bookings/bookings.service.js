"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const mailer_1 = require("@nestjs-modules/mailer");
const availability_service_1 = require("../availability/availability.service");
let BookingService = class BookingService {
    mailerService;
    prisma;
    constructor(mailerService, prisma) {
        this.mailerService = mailerService;
        this.prisma = prisma;
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_1.MailerService,
        prisma_service_1.PrismaService])
], BookingService);
let BookingsService = class BookingsService {
    prisma;
    mailerService;
    availabilityService;
    constructor(prisma, mailerService, availabilityService) {
        this.prisma = prisma;
        this.mailerService = mailerService;
        this.availabilityService = availabilityService;
    }
    async findStudentBookings(studentProfileId, statuses, upcoming, past) {
        const where = {
            studentProfileId: studentProfileId,
        };
        if (statuses) {
            if (Array.isArray(statuses)) {
                where.status = { in: statuses };
            }
            else {
                where.status = statuses;
            }
        }
        const sessionDateFilter = {};
        if (upcoming) {
            sessionDateFilter.start_time = { gt: new Date() };
        }
        if (past) {
            sessionDateFilter.start_time = { lt: new Date() };
        }
        if (upcoming || past) {
            where.session = sessionDateFilter;
        }
        return this.prisma.booking.findMany({
            where,
            include: {
                session: {
                    include: {
                        course: true,
                        tutor: {
                            include: {
                                user: {
                                    select: {
                                        full_name: true,
                                        photo_url: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                session: {
                    start_time: upcoming ? 'asc' : 'desc',
                },
            },
        });
    }
    async createBooking(studentUserId, sessionId) {
        return this.prisma.$transaction(async (tx) => {
            const studentProfile = await tx.studentProfile.findUnique({
                where: { userId: studentUserId },
                select: { id: true },
            });
            if (!studentProfile) {
                throw new common_1.NotFoundException('Perfil de estudiante no encontrado para el usuario autenticado.');
            }
            const tutoringSession = await tx.tutoringSession.findUnique({
                where: { id: sessionId },
                select: {
                    id: true,
                    status: true,
                    tutorId: true,
                    start_time: true,
                    end_time: true,
                },
            });
            if (!tutoringSession) {
                throw new common_1.NotFoundException('Sesión de tutoría no encontrada.');
            }
            if (tutoringSession.status !== client_1.BookingStatus.AVAILABLE) {
                throw new common_1.ConflictException('Esta sesión de tutoría ya no está disponible para reservar.');
            }
            const existingBookingForStudent = await tx.booking.findFirst({
                where: {
                    studentProfileId: studentProfile.id,
                    sessionId: sessionId,
                    status: {
                        in: [client_1.BookingStatus.PENDING, client_1.BookingStatus.CONFIRMED],
                    },
                },
            });
            if (existingBookingForStudent) {
                throw new common_1.ConflictException('Ya tienes una reserva para esta sesión.');
            }
            const overlappingBooking = await tx.booking.findFirst({
                where: {
                    studentProfileId: studentProfile.id,
                    status: {
                        in: [client_1.BookingStatus.PENDING, client_1.BookingStatus.CONFIRMED],
                    },
                    session: {
                        OR: [
                            {
                                start_time: {
                                    lt: tutoringSession.end_time,
                                },
                                end_time: {
                                    gt: tutoringSession.start_time,
                                },
                            },
                        ],
                    },
                },
            });
            if (overlappingBooking) {
                throw new common_1.ConflictException('Ya tienes una tutoría agendada que se superpone con este horario.');
            }
            const booking = await tx.booking.create({
                data: {
                    sessionId: tutoringSession.id,
                    studentProfileId: studentProfile.id,
                    status: client_1.BookingStatus.PENDING,
                },
            });
            await tx.tutoringSession.update({
                where: { id: sessionId },
                data: { status: client_1.BookingStatus.PENDING },
            });
            const studentUser = await tx.user.findUnique({
                where: { id: studentUserId },
                select: { email: true, full_name: true },
            });
            if (studentUser?.email) {
                await this.mailerService.sendMail({
                    to: studentUser.email,
                    subject: 'Confirmación de reserva de tutoría',
                    text: `Hola ${studentUser.full_name}, tu reserva para la sesión de tutoría que comienza el ${tutoringSession.start_time.toLocaleString()} ha sido creada Exitosamente, Agradecemos tu preferencia.`,
                });
            }
            return booking;
        });
    }
    async cancelBooking(bookingId, profileId, profileType) {
        return this.prisma.$transaction(async (tx) => {
            const booking = await tx.booking.findUnique({
                where: { id: bookingId },
                include: { session: true },
            });
            if (!booking) {
                throw new common_1.NotFoundException('Reserva no encontrada.');
            }
            if ((profileType === 'student' && booking.studentProfileId !== profileId) ||
                (profileType === 'tutor' && booking.session.tutorId !== profileId)) {
                throw new common_1.ForbiddenException('No tienes permiso para cancelar esta reserva.');
            }
            if (booking.status === client_1.BookingStatus.CANCELLED) {
                throw new common_1.ConflictException('Esta reserva ya ha sido cancelada.');
            }
            const now = new Date();
            if (booking.session.start_time < now) {
                throw new common_1.BadRequestException('No se puede cancelar una tutoría que ya ha comenzado o terminado.');
            }
            await tx.booking.update({
                where: { id: bookingId },
                data: { status: client_1.BookingStatus.CANCELLED },
            });
            if (profileType === 'student' &&
                (booking.session.status === client_1.BookingStatus.PENDING || booking.session.status === client_1.BookingStatus.CONFIRMED)) {
                await tx.tutoringSession.update({
                    where: { id: booking.sessionId },
                    data: { status: client_1.BookingStatus.AVAILABLE },
                });
            }
            else if (profileType === 'tutor' &&
                booking.session.status === client_1.BookingStatus.PENDING) {
                await tx.tutoringSession.update({
                    where: { id: booking.sessionId },
                    data: { status: client_1.BookingStatus.AVAILABLE },
                });
            }
        });
    }
    async confirmBooking(bookingId, tutorProfileId) {
        return this.prisma.$transaction(async (tx) => {
            const booking = await tx.booking.findUnique({
                where: { id: bookingId },
                include: { session: true },
            });
            if (!booking) {
                throw new common_1.NotFoundException('Reserva no encontrada.');
            }
            if (booking.session.tutorId !== tutorProfileId) {
                throw new common_1.ForbiddenException('No tienes permiso para confirmar esta reserva.');
            }
            if (booking.status !== client_1.BookingStatus.PENDING) {
                throw new common_1.ConflictException('Solo puedes confirmar reservas pendientes.');
            }
            await tx.booking.update({
                where: { id: bookingId },
                data: { status: client_1.BookingStatus.CONFIRMED },
            });
            await tx.tutoringSession.update({
                where: { id: booking.sessionId },
                data: { status: client_1.BookingStatus.CONFIRMED },
            });
            const start = new Date(booking.session.start_time);
            const end = new Date(booking.session.end_time);
            const daysMap = [
                'DOMINGO',
                'LUNES',
                'MARTES',
                'MIERCOLES',
                'JUEVES',
                'VIERNES',
                'SABADO',
            ];
            const day_of_week = daysMap[start.getUTCDay()];
            const normalizeTime = (d) => new Date(Date.UTC(1970, 0, 1, d.getUTCHours(), d.getUTCMinutes(), 0, 0));
            const normalizedStart = normalizeTime(start);
            const normalizedEnd = normalizeTime(end);
            console.log('----- ELIMINANDO BLOQUE DISPONIBLE -----');
            console.log('Tutor ID:', tutorProfileId);
            console.log('Día:', day_of_week);
            console.log('Start normalizado:', normalizedStart.toISOString());
            console.log('End normalizado:', normalizedEnd.toISOString());
            console.log('----------------------------------------');
            const deleted = await tx.availabilityBlock.deleteMany({
                where: {
                    tutorId: tutorProfileId,
                    day_of_week: day_of_week,
                    start_time: normalizedStart,
                    end_time: normalizedEnd,
                },
            });
            console.log(`Bloques eliminados: ${deleted.count}`);
        });
    }
    async confirmBookingBySession(sessionId, tutorProfileId) {
        const booking = await this.prisma.booking.findFirst({
            where: {
                sessionId,
                status: client_1.BookingStatus.PENDING,
                session: { tutorId: tutorProfileId },
            },
            include: { session: true },
        });
        if (!booking)
            throw new common_1.NotFoundException('No hay solicitud pendiente para esta tutoría.');
        await this.confirmBooking(booking.id, tutorProfileId);
    }
    async cancelBookingBySession(sessionId, tutorProfileId, profileType) {
        const booking = await this.prisma.booking.findFirst({
            where: {
                sessionId,
                status: client_1.BookingStatus.PENDING,
                session: { tutorId: tutorProfileId },
            },
            include: { session: true },
        });
        if (!booking)
            throw new common_1.NotFoundException('No hay solicitud pendiente para esta tutoría.');
        await this.cancelBooking(booking.id, tutorProfileId, profileType);
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, mailer_1.MailerService, availability_service_1.AvailabilityService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map