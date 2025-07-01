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
exports.FeedbackService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FeedbackService = class FeedbackService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, userId) {
        const studentProfile = await this.prisma.studentProfile.findUnique({
            where: { userId },
        });
        if (!studentProfile) {
            throw new common_1.ForbiddenException('Solo los estudiantes pueden dejar retroalimentación');
        }
        const session = await this.prisma.tutoringSession.findUnique({
            where: { id: dto.sessionId },
            include: { bookings: true },
        });
        if (!session) {
            throw new common_1.NotFoundException('Sesión no encontrada');
        }
        const studentParticipated = session.bookings.some((booking) => booking.studentProfileId === studentProfile.id);
        if (!studentParticipated) {
            throw new common_1.ForbiddenException('No participaste en esta tutoría.');
        }
        return this.prisma.feedback.create({
            data: {
                sessionId: dto.sessionId,
                authorId: studentProfile.id,
                rating: dto.rating,
                comment: dto.comment,
                is_public: false,
            },
        });
    }
    async getPublicRatings(tutorId) {
        const sessions = await this.prisma.tutoringSession.findMany({
            where: { tutorId },
            include: {
                feedbacks: true,
            },
        });
        const ratings = sessions.flatMap((session) => session.feedbacks.map((f) => f.rating));
        if (ratings.length === 0) {
            return {
                tutorId,
                averageRating: 0,
                totalRatings: 0,
            };
        }
        const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        return {
            tutorId,
            averageRating: Number(average.toFixed(2)),
            totalRatings: ratings.length,
        };
    }
    async getPrivateCommentsForTutor(tutorId, userId) {
        const tutorProfile = await this.prisma.tutorProfile.findUnique({
            where: { id: tutorId },
            include: { user: true },
        });
        if (!tutorProfile || tutorProfile.userId !== userId) {
            throw new common_1.ForbiddenException('No puedes ver los comentarios de otro tutor.');
        }
        const sessions = await this.prisma.tutoringSession.findMany({
            where: { tutorId },
            include: {
                feedbacks: {
                    where: {
                        comment: {
                            not: null,
                        },
                    },
                    select: {
                        comment: true,
                        rating: true,
                        created_at: true,
                    },
                },
            },
        });
        const comments = sessions.flatMap((session) => session.feedbacks);
        return {
            tutorId,
            totalComments: comments.length,
            comments,
        };
    }
};
exports.FeedbackService = FeedbackService;
exports.FeedbackService = FeedbackService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FeedbackService);
//# sourceMappingURL=feedback.service.js.map