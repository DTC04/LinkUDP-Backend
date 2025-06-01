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
exports.BookingsController = void 0;
const common_1 = require("@nestjs/common");
const bookings_service_1 = require("./bookings.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const get_user_decorator_1 = require("../auth/get-user.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../prisma/prisma.service");
let BookingsController = class BookingsController {
    bookingsService;
    prisma;
    constructor(bookingsService, prisma) {
        this.bookingsService = bookingsService;
        this.prisma = prisma;
    }
    async cancelBooking(user, bookingId) {
        if (!user || !user.id) {
            throw new common_1.UnauthorizedException('Usuario no autenticado.');
        }
        const parsedBookingId = parseInt(bookingId, 10);
        if (isNaN(parsedBookingId)) {
            throw new common_1.BadRequestException('ID de reserva inválido.');
        }
        const [studentProfile, tutorProfile] = await Promise.all([
            this.prisma.studentProfile.findUnique({
                where: { userId: user.id },
                select: { id: true },
            }),
            this.prisma.tutorProfile.findUnique({
                where: { userId: user.id },
                select: { id: true },
            }),
        ]);
        if (studentProfile) {
            await this.bookingsService.cancelBooking(parsedBookingId, studentProfile.id, 'student');
            return;
        }
        if (tutorProfile) {
            await this.bookingsService.cancelBooking(parsedBookingId, tutorProfile.id, 'tutor');
            return;
        }
        throw new common_1.NotFoundException('No se encontró un perfil de estudiante o tutor para el usuario autenticado.');
    }
    async bookTutoringSession(user, sessionId) {
        if (user.role !== 'STUDENT' && user.role !== 'BOTH') {
            throw new common_1.BadRequestException('Solo los estudiantes pueden agendar tutorías.');
        }
        const sessionIdNum = parseInt(sessionId, 10);
        if (isNaN(sessionIdNum)) {
            throw new common_1.BadRequestException('ID de sesión inválido.');
        }
        return this.bookingsService.createBooking(user.id, sessionIdNum);
    }
    async getMyBookings(user, statuses, upcoming, past) {
        if (!user || !user.id) {
            throw new common_1.UnauthorizedException('Usuario no autenticado.');
        }
        const studentProfile = await this.prisma.studentProfile.findUnique({
            where: { userId: user.id },
            select: { id: true },
        });
        if (!studentProfile) {
            throw new common_1.NotFoundException('Perfil de estudiante no encontrado para el usuario autenticado.');
        }
        return this.bookingsService.findStudentBookings(studentProfile.id, statuses, upcoming, past);
    }
    async confirmBooking(id, req) {
        const tutorUserId = req.user.id;
        const tutorProfile = await this.prisma.tutorProfile.findUnique({
            where: { userId: tutorUserId },
            select: { id: true },
        });
        if (!tutorProfile) {
            throw new common_1.NotFoundException('Perfil de tutor no encontrado para el usuario autenticado.');
        }
        const bookingId = Number(id);
        if (isNaN(bookingId)) {
            throw new common_1.BadRequestException('ID de reserva inválido.');
        }
        await this.bookingsService.confirmBooking(bookingId, tutorProfile.id);
        return { message: 'Reserva confirmada' };
    }
    async confirmBookingBySession(sessionId, user) {
        const tutorProfile = await this.prisma.tutorProfile.findUnique({
            where: { userId: user.id },
            select: { id: true },
        });
        if (!tutorProfile) {
            throw new common_1.NotFoundException('Perfil de tutor no encontrado.');
        }
        await this.bookingsService.confirmBookingBySession(Number(sessionId), tutorProfile.id);
        return { message: 'Reserva confirmada' };
    }
    async cancelBookingBySession(sessionId, user) {
        const tutorProfile = await this.prisma.tutorProfile.findUnique({
            where: { userId: user.id },
            select: { id: true },
        });
        if (!tutorProfile) {
            throw new common_1.NotFoundException('Perfil de tutor no encontrado.');
        }
        await this.bookingsService.cancelBookingBySession(Number(sessionId), tutorProfile.id, 'tutor');
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, common_1.Patch)(':bookingId/cancel'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({
        summary: 'Cancelar una reserva existente para el estudiante autenticado',
    }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Reserva cancelada exitosamente.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'No autorizado.' }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Acceso denegado (el usuario no es el dueño de la reserva o no puede cancelarla en este estado).',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Reserva no encontrada.' }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('bookingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "cancelBooking", null);
__decorate([
    (0, common_1.Post)(':sessionId/book'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'La tutoría ha sido agendada con éxito.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Sesión de tutoría no encontrada o perfil de estudiante no encontrado.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'La sesión de tutoría ya no está disponible o el estudiante ya tiene una reserva para esta sesión/superpuesta.',
    }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "bookTutoringSession", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener las reservas del estudiante autenticado' }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        description: 'Filtrar por estado de reserva (PENDING, CONFIRMED, CANCELLED, COMPLETED). Puede ser un string o un array.',
        type: String,
        isArray: true,
        enum: client_1.BookingStatus,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'upcoming',
        required: false,
        description: 'Filtrar solo reservas futuras.',
        type: Boolean,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'past',
        required: false,
        description: 'Filtrar solo reservas pasadas.',
        type: Boolean,
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Reservas obtenidas exitosamente.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'No autorizado.' }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Perfil de estudiante no encontrado.',
    }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('upcoming', new common_1.ParseBoolPipe({ optional: true }))),
    __param(3, (0, common_1.Query)('past', new common_1.ParseBoolPipe({ optional: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Boolean, Boolean]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "getMyBookings", null);
__decorate([
    (0, common_1.Patch)(':id/confirm'),
    (0, swagger_1.ApiOperation)({
        summary: 'Confirmar una reserva existente para el tutor autenticado',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Reserva confirmada exitosamente.' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'No autorizado.' }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Reserva no encontrada.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "confirmBooking", null);
__decorate([
    (0, common_1.Patch)('/session/:sessionId/confirm'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "confirmBookingBySession", null);
__decorate([
    (0, common_1.Patch)('/session/:sessionId/cancel'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "cancelBookingBySession", null);
exports.BookingsController = BookingsController = __decorate([
    (0, swagger_1.ApiTags)('bookings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('bookings'),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService,
        prisma_service_1.PrismaService])
], BookingsController);
//# sourceMappingURL=bookings.controller.js.map