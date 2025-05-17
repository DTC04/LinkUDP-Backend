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
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
function formatTime(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.warn('formatTime recibió una fecha inválida:', date);
        return '00:00';
    }
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}
let ProfileService = class ProfileService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMyProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                studentProfile: {
                    include: {
                        interests: {
                            include: {
                                course: { select: { name: true, id: true } },
                            },
                        },
                    },
                },
                tutorProfile: {
                    include: {
                        courses: {
                            include: {
                                course: { select: { name: true, id: true } },
                            },
                        },
                        availability: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        const response = {
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                photo_url: user.photo_url,
                email_verified: user.email_verified,
            },
        };
        if (user.studentProfile) {
            response.studentProfile = {
                university: user.studentProfile.university,
                career: user.studentProfile.career,
                study_year: user.studentProfile.study_year,
                bio: user.studentProfile.bio,
                interests: user.studentProfile.interests.map((interest) => ({
                    courseId: interest.courseId,
                    courseName: interest.course.name,
                })),
            };
        }
        if (user.tutorProfile) {
            response.tutorProfile = {
                bio: user.tutorProfile.bio,
                average_rating: user.tutorProfile.average_rating,
                cv_url: user.tutorProfile.cv_url,
                experience_details: user.tutorProfile.experience_details,
                tutoring_contact_email: user.tutorProfile.tutoring_contact_email,
                tutoring_phone: user.tutorProfile.tutoring_phone,
                courses: user.tutorProfile.courses.map((tc) => ({
                    courseId: tc.courseId,
                    courseName: tc.course.name,
                    level: tc.level,
                    grade: tc.grade,
                })),
                availability: user.tutorProfile.availability.map((ab) => ({
                    day_of_week: ab.day_of_week,
                    start_time: formatTime(ab.start_time),
                    end_time: formatTime(ab.end_time),
                })),
            };
        }
        return response;
    }
    async updateUserProfile(userId, dto) {
        const { full_name, photo_url, bio, university, career, study_year, interestCourseIds, } = dto;
        const userToUpdate = {};
        if (full_name !== undefined)
            userToUpdate.full_name = full_name;
        if (photo_url !== undefined)
            userToUpdate.photo_url = photo_url;
        const studentProfileData = {};
        const tutorProfileData = {};
        if (bio !== undefined) {
            studentProfileData.bio = bio;
            tutorProfileData.bio = bio;
        }
        if (university !== undefined)
            studentProfileData.university = university;
        if (career !== undefined)
            studentProfileData.career = career;
        if (study_year !== undefined)
            studentProfileData.study_year = study_year;
        try {
            return await this.prisma.$transaction(async (tx) => {
                const currentUserData = await tx.user.findUnique({
                    where: { id: userId },
                    select: { studentProfile: true, tutorProfile: true },
                });
                if (!currentUserData) {
                    throw new common_1.NotFoundException('Usuario no encontrado para actualizar.');
                }
                const updatedUser = await tx.user.update({
                    where: { id: userId },
                    data: userToUpdate,
                });
                if (currentUserData.studentProfile) {
                    await tx.studentProfile.update({
                        where: { userId },
                        data: studentProfileData,
                    });
                    if (interestCourseIds !== undefined) {
                        await tx.studentInterest.deleteMany({
                            where: { studentProfileId: currentUserData.studentProfile.id },
                        });
                        if (interestCourseIds.length > 0) {
                            await tx.studentInterest.createMany({
                                data: interestCourseIds.map((courseId) => ({
                                    studentProfileId: currentUserData.studentProfile.id,
                                    courseId,
                                })),
                                skipDuplicates: true,
                            });
                        }
                    }
                }
                if (currentUserData.tutorProfile && bio !== undefined) {
                    await tx.tutorProfile.update({
                        where: { userId },
                        data: { bio: tutorProfileData.bio },
                    });
                }
                return tx.user.findUniqueOrThrow({
                    where: { id: userId },
                    include: {
                        studentProfile: {
                            include: { interests: { include: { course: true } } },
                        },
                        tutorProfile: {
                            include: {
                                courses: { include: { course: true } },
                                availability: true,
                            },
                        },
                    },
                });
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new common_1.NotFoundException('Usuario, perfil de estudiante o perfil de tutor no encontrado para actualizar.');
                }
            }
            console.error('Error updating user profile:', error);
            throw new common_1.InternalServerErrorException('Error al actualizar el perfil del usuario.');
        }
    }
    async updateTutorSpecificProfile(userId, dto) {
        const currentUser = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!currentUser) {
            throw new common_1.NotFoundException('Usuario no encontrado.');
        }
        let tutorProfile = await this.prisma.tutorProfile.findUnique({
            where: { userId },
        });
        const { bio, cv_url, experience_details, tutoring_contact_email, tutoring_phone, availability, courses, } = dto;
        if (!tutorProfile) {
            tutorProfile = await this.prisma.tutorProfile.create({
                data: {
                    userId: userId,
                    bio: bio || '',
                },
            });
        }
        const dataToUpdate = {};
        if (bio !== undefined)
            dataToUpdate.bio = bio;
        if (cv_url !== undefined)
            dataToUpdate.cv_url = cv_url;
        if (experience_details !== undefined)
            dataToUpdate.experience_details = experience_details;
        if (tutoring_contact_email !== undefined)
            dataToUpdate.tutoring_contact_email = tutoring_contact_email;
        if (tutoring_phone !== undefined)
            dataToUpdate.tutoring_phone = tutoring_phone;
        try {
            return await this.prisma.$transaction(async (tx) => {
                const updatedTutorProfile = await tx.tutorProfile.update({
                    where: { id: tutorProfile.id },
                    data: dataToUpdate,
                });
                if (currentUser.role === client_1.Role.STUDENT) {
                    await tx.user.update({
                        where: { id: userId },
                        data: { role: client_1.Role.BOTH },
                    });
                }
                if (availability !== undefined) {
                    await tx.availabilityBlock.deleteMany({
                        where: { tutorId: updatedTutorProfile.id },
                    });
                    if (availability.length > 0) {
                        const availabilityData = availability.map((block) => {
                            const [startHour, startMinute] = block.start_time
                                .split(':')
                                .map(Number);
                            const [endHour, endMinute] = block.end_time
                                .split(':')
                                .map(Number);
                            const baseDate = '1970-01-01T';
                            return {
                                tutorId: updatedTutorProfile.id,
                                day_of_week: block.day_of_week,
                                start_time: new Date(`${baseDate}${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00.000Z`),
                                end_time: new Date(`${baseDate}${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00.000Z`),
                            };
                        });
                        await tx.availabilityBlock.createMany({ data: availabilityData });
                    }
                }
                if (courses !== undefined) {
                    await tx.tutorCourse.deleteMany({
                        where: { tutorId: updatedTutorProfile.id },
                    });
                    if (courses.length > 0) {
                        const tutorCoursesData = courses.map((courseDto) => ({
                            tutorId: updatedTutorProfile.id,
                            courseId: courseDto.courseId,
                            level: courseDto.level,
                            grade: courseDto.grade !== undefined ? courseDto.grade : 0,
                        }));
                        await tx.tutorCourse.createMany({ data: tutorCoursesData });
                    }
                }
                return tx.tutorProfile.findUniqueOrThrow({
                    where: { id: updatedTutorProfile.id },
                    include: {
                        courses: { include: { course: true } },
                        availability: true,
                        user: true,
                    },
                });
            });
        }
        catch (error) {
            console.error('Error updating tutor specific profile:', error);
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2003') {
                    throw new common_1.BadRequestException('Uno de los IDs de curso proporcionados no es válido o no existe.');
                }
                else if (error.code === 'P2025') {
                    throw new common_1.NotFoundException('Perfil de tutor no encontrado para actualizar. Esto no debería suceder si la creación/búsqueda inicial fue exitosa.');
                }
            }
            throw new common_1.InternalServerErrorException('Error al actualizar el perfil específico del tutor.');
        }
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProfileService);
//# sourceMappingURL=profile.service.js.map