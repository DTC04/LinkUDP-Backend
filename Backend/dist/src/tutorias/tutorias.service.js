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
var TutoriasService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutoriasService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const mailer_1 = require("@nestjs-modules/mailer");
let TutoriasService = TutoriasService_1 = class TutoriasService {
    prisma;
    mailerService;
    logger = new common_1.Logger(TutoriasService_1.name);
    constructor(prisma, mailerService) {
        this.prisma = prisma;
        this.mailerService = mailerService;
    }
    async create(createTutoriaDto) {
        if (!createTutoriaDto.tutorId ||
            !createTutoriaDto.courseId ||
            !createTutoriaDto.title ||
            !createTutoriaDto.description ||
            !createTutoriaDto.date ||
            !createTutoriaDto.start_time ||
            !createTutoriaDto.end_time) {
            throw new Error('Todos los campos son requeridos para publicar la tutoría.');
        }
        return this.prisma.tutoringSession.create({
            data: {
                tutorId: createTutoriaDto.tutorId,
                courseId: createTutoriaDto.courseId,
                title: createTutoriaDto.title,
                description: createTutoriaDto.description,
                date: new Date(createTutoriaDto.date),
                start_time: new Date(createTutoriaDto.start_time),
                end_time: new Date(createTutoriaDto.end_time),
                location: createTutoriaDto.location,
                notes: createTutoriaDto.notes,
            },
        });
    }
    async findAll(ramo, horario, tutorId, status, upcoming, limit) {
        const where = {};
        if (tutorId) {
            where.tutorId = tutorId;
        }
        if (status) {
            if (Array.isArray(status)) {
                const validStatuses = status.filter(s => Object.values(client_1.BookingStatus).includes(s));
                if (validStatuses.length > 0) {
                    where.status = { in: validStatuses };
                }
            }
            else if (Object.values(client_1.BookingStatus).includes(status)) {
                where.status = status;
            }
        }
        else if (!tutorId) {
            where.status = { in: ['AVAILABLE', 'PENDING', 'CONFIRMED'] };
        }
        if (ramo) {
            where.course = {
                name: {
                    contains: ramo,
                    mode: 'insensitive',
                },
            };
        }
        if (upcoming) {
            where.start_time = {
                gt: new Date(),
            };
        }
        if (horario) {
            console.warn('El filtro por horario aún no está completamente implementado.');
        }
        return this.prisma.tutoringSession.findMany({
            where,
            take: limit,
            include: {
                tutor: {
                    include: {
                        user: {
                            select: { id: true, full_name: true, email: true, photo_url: true },
                        }
                    }
                },
                course: true,
                bookings: {
                    include: {
                        studentProfile: {
                            include: {
                                user: { select: { full_name: true } }
                            }
                        }
                    }
                }
            },
            orderBy: {
                start_time: 'asc',
            },
        });
    }
    async findOne(id) {
        const tutoria = await this.prisma.tutoringSession.findUnique({
            where: { id },
            include: {
                tutor: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                full_name: true,
                                email: true,
                                photo_url: true,
                            }
                        }
                    }
                },
                course: true,
            },
        });
        if (!tutoria) {
            throw new common_1.NotFoundException(`Tutoría con ID "${id}" no encontrada.`);
        }
        return tutoria;
    }
    async update(id, updateTutoriaDto) {
        const { date, start_time, end_time, ...restOfDto } = updateTutoriaDto;
        const dataToUpdate = { ...restOfDto };
        if (date) {
            dataToUpdate.date = new Date(date);
        }
        if (start_time) {
            dataToUpdate.start_time = new Date(start_time);
        }
        if (end_time) {
            dataToUpdate.end_time = new Date(end_time);
        }
        try {
            const updatedTutoria = await this.prisma.tutoringSession.update({
                where: { id },
                data: dataToUpdate,
                include: {
                    course: true,
                }
            });
            const bookings = await this.prisma.booking.findMany({
                where: {
                    sessionId: id,
                    status: { in: [client_1.BookingStatus.CONFIRMED, client_1.BookingStatus.PENDING] }
                },
                include: {
                    studentProfile: {
                        include: {
                            user: {
                                include: {
                                    NotificationPreference: true,
                                }
                            }
                        }
                    }
                }
            });
            for (const booking of bookings) {
                const studentUser = booking.studentProfile.user;
                if (studentUser) {
                    const notificationPayload = {
                        message: `La tutoría "${updatedTutoria.title}" de la asignatura "${updatedTutoria.course.name}" ha sido actualizada.`,
                        details: `Fecha: ${updatedTutoria.start_time.toLocaleDateString()}, Hora: ${updatedTutoria.start_time.toLocaleTimeString()} - ${updatedTutoria.end_time.toLocaleTimeString()}`,
                        tutoriaId: updatedTutoria.id,
                    };
                    await this.prisma.notification.create({
                        data: {
                            userId: studentUser.id,
                            type: 'TUTORIA_UPDATED',
                            payload: notificationPayload,
                        }
                    });
                    this.logger.log(`In-app notification created for user ${studentUser.id} for updated tutoria ${updatedTutoria.id}`);
                    const prefs = studentUser.NotificationPreference;
                    const shouldSendEmail = !prefs || prefs.email_on_cancellation !== false;
                    if (shouldSendEmail) {
                        try {
                            const emailSubject = `Actualización de Tutoría: ${updatedTutoria.title}`;
                            const eventTime = new Date(updatedTutoria.start_time);
                            const emailText = `Hola ${studentUser.full_name},\n\nLa tutoría "${updatedTutoria.title}" de la asignatura "${updatedTutoria.course.name}" ha sido actualizada.\nNuevos detalles:\nHorario: ${eventTime.toLocaleString()}\nDuración aproximada: ${(new Date(updatedTutoria.end_time).getTime() - eventTime.getTime()) / (1000 * 60)} minutos.\n\nPuedes ver los detalles en: ${process.env.FRONTEND_URL}/tutoring/${updatedTutoria.id}\n\nSaludos,\nEquipo LinkUDP`;
                            await this.mailerService.sendMail({
                                to: studentUser.email,
                                subject: emailSubject,
                                text: emailText,
                            });
                            this.logger.log(`Email notification successfully sent to ${studentUser.email} for updated tutoria ${updatedTutoria.id}`);
                        }
                        catch (emailError) {
                            this.logger.error(`Failed to send update email to ${studentUser.email} for tutoria ${id}: ${emailError.message}`, emailError.stack);
                        }
                    }
                }
                else {
                    this.logger.warn(`Student user not found for booking ID ${booking.id} during tutoria update ${updatedTutoria.id}. Skipping notifications for this booking.`);
                }
            }
            return updatedTutoria;
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new common_1.NotFoundException(`Tutoría con ID "${id}" no encontrada.`);
            }
            this.logger.error(`Error updating tutoria ${id}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async remove(id) {
        const tutoriaToDelete = await this.prisma.tutoringSession.findUnique({
            where: { id },
            include: {
                course: true,
                bookings: {
                    where: {
                        status: { in: [client_1.BookingStatus.CONFIRMED, client_1.BookingStatus.PENDING] }
                    },
                    include: {
                        studentProfile: {
                            include: {
                                user: {
                                    include: {
                                        NotificationPreference: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!tutoriaToDelete) {
            throw new common_1.NotFoundException(`Tutoría con ID "${id}" no encontrada para eliminar.`);
        }
        for (const booking of tutoriaToDelete.bookings) {
            const studentUser = booking.studentProfile.user;
            if (studentUser) {
                const notificationPayload = {
                    message: `La tutoría "${tutoriaToDelete.title}" de la asignatura "${tutoriaToDelete.course.name}" ha sido cancelada por el tutor.`,
                    details: `Estaba programada para: ${tutoriaToDelete.start_time.toLocaleDateString()}, Hora: ${tutoriaToDelete.start_time.toLocaleTimeString()} - ${tutoriaToDelete.end_time.toLocaleTimeString()}`,
                    tutoriaId: tutoriaToDelete.id,
                };
                await this.prisma.notification.create({
                    data: {
                        userId: studentUser.id,
                        type: 'TUTORIA_CANCELLED_BY_TUTOR',
                        payload: notificationPayload,
                    }
                });
                this.logger.log(`In-app notification created for user ${studentUser.id} for cancelled tutoria ${tutoriaToDelete.id}`);
                const prefs = studentUser.NotificationPreference;
                const shouldSendEmailCancellation = !prefs || prefs.email_on_cancellation !== false;
                if (shouldSendEmailCancellation) {
                    try {
                        const emailSubject = `Cancelación de Tutoría: ${tutoriaToDelete.title}`;
                        const eventTimeCancelled = new Date(tutoriaToDelete.start_time);
                        const emailText = `Hola ${studentUser.full_name},\n\nLamentamos informarte que la tutoría "${tutoriaToDelete.title}" de la asignatura "${tutoriaToDelete.course.name}", programada para ${eventTimeCancelled.toLocaleString()}, ha sido cancelada por el tutor.\n\nSaludos,\nEquipo LinkUDP`;
                        await this.mailerService.sendMail({
                            to: studentUser.email,
                            subject: emailSubject,
                            text: emailText,
                        });
                        this.logger.log(`Email notification successfully sent to ${studentUser.email} for cancelled tutoria ${tutoriaToDelete.id}`);
                    }
                    catch (emailError) {
                        this.logger.error(`Failed to send cancellation email to ${studentUser.email} for tutoria ${id}: ${emailError.message}`, emailError.stack);
                    }
                }
            }
        }
        await this.prisma.booking.deleteMany({
            where: { sessionId: id },
        });
        this.logger.log(`Bookings for session ${id} deleted before session deletion.`);
        try {
            return await this.prisma.tutoringSession.delete({
                where: { id },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new common_1.NotFoundException(`Tutoría con ID "${id}" no encontrada.`);
            }
            throw error;
        }
    }
    async contactTutor(sessionId, studentUserId, message) {
        const session = await this.prisma.tutoringSession.findUnique({
            where: { id: sessionId },
            include: {
                course: true,
                tutor: { include: { user: true } },
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Sesión de tutoría no encontrada.');
        }
        const studentProfile = await this.prisma.studentProfile.findFirst({
            where: { userId: studentUserId },
            include: { user: true },
        });
        if (!studentProfile) {
            throw new common_1.NotFoundException('Perfil de estudiante no encontrado.');
        }
        const subject = `Mensaje sobre tu tutoría de ${session.course.name}`;
        const text = `
Hola ${session.tutor.user.full_name},

El estudiante ${studentProfile.user.full_name} (${studentProfile.user.email}) te ha enviado un mensaje sobre la tutoría de ${session.course.name.toUpperCase()} agendada para ${session.date.toLocaleDateString()}:

"${message}"

¡Por favor responde a la brevedad para coordinar!

— Plataforma LinkUDP
`;
        await this.mailerService.sendMail({
            to: session.tutor.user.email,
            subject,
            text,
        });
        this.logger.log(`Correo enviado al tutor ${session.tutor.user.email} desde el estudiante ${studentProfile.user.email} sobre la sesión ${session.id}`);
    }
};
exports.TutoriasService = TutoriasService;
exports.TutoriasService = TutoriasService = TutoriasService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mailer_1.MailerService])
], TutoriasService);
//# sourceMappingURL=tutorias.service.js.map