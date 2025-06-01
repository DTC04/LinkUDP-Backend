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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutoriasService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const core_1 = require("@nestjs/core");
let TutoriasService = class TutoriasService {
    prisma;
    request;
    constructor(prisma, request) {
        this.prisma = prisma;
        this.request = request;
    }
    getAuthenticatedUserId() {
        const user = this.request.user;
        if (!user || !user.id) {
            throw new common_1.UnauthorizedException('Usuario no autenticado.');
        }
        return user.id;
    }
    async create(createTutoriaDto) {
        const authenticatedUserId = this.getAuthenticatedUserId();
        if (createTutoriaDto.tutorId !== authenticatedUserId) {
            throw new common_1.UnauthorizedException('No puedes crear tutorías para otro tutor.');
        }
        const startDate = new Date(createTutoriaDto.start_time);
        const endDate = new Date(createTutoriaDto.end_time);
        const sessionDate = new Date(createTutoriaDto.date);
        if (startDate <= new Date() || sessionDate <= new Date()) {
            throw new common_1.BadRequestException('La fecha y hora de la tutoría no pueden ser en el pasado.');
        }
        if (startDate >= endDate) {
            throw new common_1.BadRequestException('La hora de inicio debe ser anterior a la hora de finalización.');
        }
        return this.prisma.tutoringSession.create({
            data: {
                tutorId: authenticatedUserId,
                courseId: createTutoriaDto.courseId,
                title: createTutoriaDto.title,
                description: createTutoriaDto.description,
                date: sessionDate,
                start_time: startDate,
                end_time: endDate,
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
            where.status = { in: [client_1.BookingStatus.AVAILABLE, client_1.BookingStatus.PENDING] };
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
                                user: { select: { full_name: true, email: true } }
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
                bookings: {
                    where: {
                        status: { in: [client_1.BookingStatus.PENDING, client_1.BookingStatus.CONFIRMED] }
                    },
                    include: {
                        studentProfile: {
                            include: {
                                user: { select: { email: true, full_name: true } }
                            }
                        }
                    }
                }
            },
        });
        if (!tutoria) {
            throw new common_1.NotFoundException(`Tutoría con ID "${id}" no encontrada.`);
        }
        return tutoria;
    }
    async update(id, updateTutoriaDto) {
        const authenticatedUserId = this.getAuthenticatedUserId();
        const tutoria = await this.prisma.tutoringSession.findUnique({
            where: { id },
            include: {
                bookings: {
                    where: { status: { in: [client_1.BookingStatus.PENDING, client_1.BookingStatus.CONFIRMED] } },
                    include: { studentProfile: { include: { user: { select: { email: true, full_name: true } } } } }
                }
            }
        });
        if (!tutoria) {
            throw new common_1.NotFoundException(`Tutoría con ID "${id}" no encontrada.`);
        }
        if (tutoria.tutorId !== authenticatedUserId) {
            throw new common_1.UnauthorizedException('No tienes permiso para actualizar esta tutoría.');
        }
        const { date, start_time, end_time, ...restOfDto } = updateTutoriaDto;
        const dataToUpdate = { ...restOfDto };
        let newDate;
        let newStartTime;
        let newEndTime;
        if (date) {
            newDate = new Date(date);
            dataToUpdate.date = newDate;
        }
        if (start_time) {
            newStartTime = new Date(start_time);
            dataToUpdate.start_time = newStartTime;
        }
        if (end_time) {
            newEndTime = new Date(end_time);
            dataToUpdate.end_time = newEndTime;
        }
        const effectiveStartTime = newStartTime || tutoria.start_time;
        const effectiveEndTime = newEndTime || tutoria.end_time;
        const effectiveDate = newDate || tutoria.date;
        if (effectiveStartTime <= new Date() || effectiveDate <= new Date()) {
            throw new common_1.BadRequestException('La fecha y hora de la tutoría no pueden ser en el pasado.');
        }
        if (effectiveStartTime >= effectiveEndTime) {
            throw new common_1.BadRequestException('La hora de inicio debe ser anterior a la hora de finalización.');
        }
        const changedFields = [];
        if (updateTutoriaDto.date && new Date(updateTutoriaDto.date).toISOString() !== tutoria.date.toISOString())
            changedFields.push("fecha");
        if (updateTutoriaDto.start_time && new Date(updateTutoriaDto.start_time).toISOString() !== tutoria.start_time.toISOString())
            changedFields.push("hora de inicio");
        if (updateTutoriaDto.end_time && new Date(updateTutoriaDto.end_time).toISOString() !== tutoria.end_time.toISOString())
            changedFields.push("hora de fin");
        if (updateTutoriaDto.location && updateTutoriaDto.location !== tutoria.location)
            changedFields.push("ubicación");
        if (updateTutoriaDto.description && updateTutoriaDto.description !== tutoria.description)
            changedFields.push("descripción");
        if (changedFields.length > 0 && tutoria.bookings && tutoria.bookings.length > 0) {
            for (const booking of tutoria.bookings) {
                if (booking.studentProfile?.user?.email) {
                    console.log(`INFO: Notificando a ${booking.studentProfile.user.email} sobre cambios en la tutoría '${tutoria.title}'. Cambios: ${changedFields.join(', ')}`);
                }
            }
        }
        try {
            return await this.prisma.tutoringSession.update({
                where: { id },
                data: dataToUpdate,
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new common_1.NotFoundException(`Tutoría con ID "${id}" no encontrada.`);
            }
            throw error;
        }
    }
    async remove(id) {
        const authenticatedUserId = this.getAuthenticatedUserId();
        const tutoria = await this.prisma.tutoringSession.findUnique({
            where: { id },
            include: {
                bookings: {
                    where: { status: { in: [client_1.BookingStatus.PENDING, client_1.BookingStatus.CONFIRMED] } },
                    include: { studentProfile: { include: { user: { select: { email: true, full_name: true } } } } }
                }
            }
        });
        if (!tutoria) {
            throw new common_1.NotFoundException(`Tutoría con ID "${id}" no encontrada.`);
        }
        if (tutoria.tutorId !== authenticatedUserId) {
            throw new common_1.UnauthorizedException('No tienes permiso para eliminar esta tutoría.');
        }
        if (tutoria.bookings && tutoria.bookings.length > 0) {
            for (const booking of tutoria.bookings) {
                if (booking.studentProfile?.user?.email) {
                    console.log(`INFO: Notificando a ${booking.studentProfile.user.email} sobre la cancelación de la tutoría '${tutoria.title}'.`);
                }
            }
        }
        await this.prisma.booking.deleteMany({
            where: { sessionId: id },
        });
        await this.prisma.feedback.deleteMany({
            where: { sessionId: id },
        });
        try {
            return await this.prisma.tutoringSession.delete({
                where: { id },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new common_1.NotFoundException(`Tutoría con ID "${id}" no encontrada durante la eliminación.`);
            }
            throw error;
        }
    }
};
exports.TutoriasService = TutoriasService;
exports.TutoriasService = TutoriasService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(core_1.REQUEST)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], TutoriasService);
//# sourceMappingURL=tutorias.service.js.map