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
exports.TutoriasService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let TutoriasService = class TutoriasService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
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
            where.status = 'AVAILABLE';
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
};
exports.TutoriasService = TutoriasService;
exports.TutoriasService = TutoriasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TutoriasService);
//# sourceMappingURL=tutorias.service.js.map