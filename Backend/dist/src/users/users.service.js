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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                studentProfile: {
                    include: {
                        interests: {
                            include: { course: true },
                        },
                    },
                },
                tutorProfile: {
                    include: {
                        availabilities: true,
                    },
                },
            },
        });
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        return user;
    }
    async createStudentProfile(userId, data) {
        return this.prisma.studentProfile.create({
            data: {
                userId,
                university: data.university,
                career: data.career,
                study_year: data.study_year,
                bio: data.bio,
                interests: {
                    create: data.interests?.map((id) => ({
                        course: { connect: { id } },
                    })) || [],
                },
            },
        });
    }
    async createTutorProfile(userId, data) {
        const tutor = await this.prisma.tutorProfile.create({
            data: {
                userId,
                bio: data.bio,
            },
        });
        if (data.availabilities?.length) {
            await this.prisma.availabilityBlock.createMany({
                data: data.availabilities.map((a) => ({
                    tutorId: tutor.id,
                    day_of_week: a.day_of_week,
                    start_time: new Date(a.start_time),
                    end_time: new Date(a.end_time),
                })),
            });
        }
        return tutor;
    }
    async updateStudentProfile(userId, data) {
        const student = await this.prisma.studentProfile.findUnique({
            where: { userId },
        });
        if (!student)
            throw new common_1.NotFoundException('Perfil de estudiante no encontrado');
        const updated = await this.prisma.studentProfile.update({
            where: { userId },
            data: {
                university: data.university,
                career: data.career,
                study_year: data.study_year,
                bio: data.bio,
            },
        });
        if (data.interests) {
            await this.prisma.studentInterest.deleteMany({ where: { studentProfileId: student.id } });
            await this.prisma.studentInterest.createMany({
                data: data.interests.map((courseId) => ({
                    studentProfileId: student.id,
                    courseId,
                })),
            });
        }
        return updated;
    }
    async updateTutorProfile(userId, data) {
        const tutor = await this.prisma.tutorProfile.findUnique({
            where: { userId },
        });
        if (!tutor)
            throw new common_1.NotFoundException('Perfil de tutor no encontrado');
        const updated = await this.prisma.tutorProfile.update({
            where: { userId },
            data: {
                bio: data.bio,
            },
        });
        if (data.availability) {
            await this.prisma.availabilityBlock.deleteMany({ where: { tutorId: tutor.id } });
            await this.prisma.availabilityBlock.createMany({
                data: data.availability.map((a) => ({
                    tutorId: tutor.id,
                    day_of_week: a.day_of_week,
                    start_time: new Date(a.start_time),
                    end_time: new Date(a.end_time),
                })),
            });
        }
        return updated;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map