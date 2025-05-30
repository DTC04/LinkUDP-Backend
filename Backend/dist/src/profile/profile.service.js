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
var ProfileService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
function formatTime(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return '00:00';
    }
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}
let ProfileService = ProfileService_1 = class ProfileService {
    prisma;
    logger = new common_1.Logger(ProfileService_1.name);
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
                id: user.studentProfile.id,
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
                id: user.tutorProfile.id,
                bio: user.tutorProfile.bio,
                average_rating: user.tutorProfile.average_rating,
                cv_url: user.tutorProfile.cv_url,
                experience_details: user.tutorProfile.experience_details,
                tutoring_contact_email: user.tutorProfile.tutoring_contact_email,
                tutoring_phone: user.tutorProfile.tutoring_phone,
                university: user.tutorProfile.university,
                degree: user.tutorProfile.degree,
                academic_year: user.tutorProfile.academic_year,
                courses: user.tutorProfile.courses.map((tc) => ({
                    courseId: tc.courseId,
                    courseName: tc.course.name,
                    level: tc.level,
                    grade: tc.grade,
                })),
                availability: user.tutorProfile.availability.map((ab) => ({
                    id: ab.id,
                    day_of_week: ab.day_of_week,
                    start_time: ab.start_time.toISOString(),
                    end_time: ab.end_time.toISOString(),
                })),
            };
        }
        return response;
    }
    async updateUserProfile(userId, dto) {
        this.logger.debug(`Updating user profile for userId: ${userId}, DTO: ${JSON.stringify(dto)}`);
        const { full_name, photo_url, bio, university, career, study_year, interestCourseIds, } = dto;
        const userToUpdate = {};
        if (full_name !== undefined)
            userToUpdate.full_name = full_name;
        if (photo_url !== undefined)
            userToUpdate.photo_url = photo_url;
        const studentProfileUpdateData = {};
        const tutorProfileUpdateData = {};
        if (bio !== undefined) {
            studentProfileUpdateData.bio = bio;
            tutorProfileUpdateData.bio = bio;
        }
        if (university !== undefined)
            studentProfileUpdateData.university = university;
        if (career !== undefined)
            studentProfileUpdateData.career = career;
        if (study_year !== undefined)
            studentProfileUpdateData.study_year = study_year;
        try {
            return await this.prisma.$transaction(async (tx) => {
                const currentUser = await tx.user.findUnique({
                    where: { id: userId },
                    select: {
                        role: true,
                        studentProfile: { select: { id: true } },
                        tutorProfile: { select: { id: true } },
                    },
                });
                if (!currentUser) {
                    throw new common_1.NotFoundException('Usuario no encontrado para actualizar.');
                }
                await tx.user.update({
                    where: { id: userId },
                    data: userToUpdate,
                });
                if (currentUser.studentProfile &&
                    (bio !== undefined ||
                        university !== undefined ||
                        career !== undefined ||
                        study_year !== undefined)) {
                    await tx.studentProfile.update({
                        where: { userId },
                        data: studentProfileUpdateData,
                    });
                }
                if (currentUser.studentProfile && interestCourseIds !== undefined) {
                    await tx.studentInterest.deleteMany({
                        where: { studentProfileId: currentUser.studentProfile.id },
                    });
                    if (interestCourseIds.length > 0) {
                        await tx.studentInterest.createMany({
                            data: interestCourseIds.map((courseId) => ({
                                studentProfileId: currentUser.studentProfile.id,
                                courseId,
                            })),
                            skipDuplicates: true,
                        });
                    }
                }
                if (currentUser.tutorProfile && bio !== undefined) {
                    await tx.tutorProfile.update({
                        where: { userId },
                        data: { bio: tutorProfileUpdateData.bio },
                    });
                }
                return tx.user.findUniqueOrThrow({ where: { id: userId } });
            });
        }
        catch (error) {
            this.logger.error(`Error en updateUserProfile para userId ${userId}:`, error);
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new common_1.NotFoundException('Usuario o perfil asociado no encontrado para actualizar.');
                }
            }
            throw new common_1.InternalServerErrorException('Error al actualizar el perfil del usuario.');
        }
    }
    async updateTutorSpecificProfile(userId, dto) {
        this.logger.debug(`Updating tutor specific profile for userId: ${userId}, DTO: ${JSON.stringify(dto)}`);
        const currentUser = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (!currentUser) {
            throw new common_1.NotFoundException('Usuario no encontrado.');
        }
        let tutorProfile = await this.prisma.tutorProfile.findUnique({
            where: { userId },
        });
        if (!tutorProfile &&
            (currentUser.role === client_1.Role.TUTOR ||
                currentUser.role === client_1.Role.BOTH ||
                dto.bio !== undefined)) {
            this.logger.log(`Perfil de tutor no encontrado para userId: ${userId}. Creando nuevo TutorProfile.`);
            try {
                tutorProfile = await this.prisma.tutorProfile.create({
                    data: {
                        userId: userId,
                        bio: dto.bio || '',
                        university: dto.university,
                        degree: dto.degree,
                        academic_year: dto.academic_year,
                        cv_url: dto.cv_url,
                        experience_details: dto.experience_details,
                        tutoring_contact_email: dto.tutoring_contact_email,
                        tutoring_phone: dto.tutoring_phone,
                    },
                });
                if (currentUser.role === client_1.Role.STUDENT) {
                    this.logger.log(`Cambiando rol de STUDENT a BOTH para userId: ${userId} al crear TutorProfile.`);
                    await this.prisma.user.update({
                        where: { id: userId },
                        data: { role: client_1.Role.BOTH },
                    });
                }
            }
            catch (e) {
                this.logger.error(`Error creando TutorProfile para userId ${userId}:`, e);
                throw new common_1.InternalServerErrorException('Error al inicializar el perfil de tutor.');
            }
        }
        else if (!tutorProfile) {
            throw new common_1.NotFoundException('Perfil de tutor no encontrado y no se pudo determinar la intención de crearlo.');
        }
        const { bio, cv_url, experience_details, tutoring_contact_email, tutoring_phone, university, degree, academic_year, availability, courses, } = dto;
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
        if (university !== undefined)
            dataToUpdate.university = university;
        if (degree !== undefined)
            dataToUpdate.degree = degree;
        if (academic_year !== undefined)
            dataToUpdate.academic_year = academic_year;
        try {
            return await this.prisma.$transaction(async (tx) => {
                const updatedTutorProfile = await tx.tutorProfile.update({
                    where: { id: tutorProfile.id },
                    data: dataToUpdate,
                });
                if (currentUser.role === client_1.Role.STUDENT) {
                    const userBeingUpdated = await tx.user.findUnique({
                        where: { id: userId },
                    });
                    if (userBeingUpdated && userBeingUpdated.role === client_1.Role.STUDENT) {
                        this.logger.log(`Cambiando rol de STUDENT a BOTH para userId: ${userId} durante actualización de TutorProfile.`);
                        await tx.user.update({
                            where: { id: userId },
                            data: { role: client_1.Role.BOTH },
                        });
                    }
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
                        const courseIds = courses.map((c) => c.courseId);
                        const existingCourses = await tx.course.findMany({
                            where: { id: { in: courseIds } },
                        });
                        if (existingCourses.length !== courseIds.length) {
                            const notFoundIds = courseIds.filter((id) => !existingCourses.find((ec) => ec.id === id));
                            this.logger.warn(`Algunos courseId no fueron encontrados: ${notFoundIds.join(', ')}`);
                            throw new common_1.BadRequestException(`Los siguientes IDs de curso no son válidos: ${notFoundIds.join(', ')}`);
                        }
                        const tutorCoursesData = courses.map((courseDto) => ({
                            tutorId: updatedTutorProfile.id,
                            courseId: courseDto.courseId,
                            level: courseDto.level,
                            grade: courseDto.grade !== undefined ? courseDto.grade : 0,
                        }));
                        await tx.tutorCourse.createMany({
                            data: tutorCoursesData,
                            skipDuplicates: true,
                        });
                    }
                }
                return tx.tutorProfile.findUniqueOrThrow({
                    where: { id: updatedTutorProfile.id },
                    include: {
                        courses: { include: { course: true } },
                        availability: true,
                    },
                });
            });
        }
        catch (error) {
            this.logger.error(`Error en updateTutorSpecificProfile para userId ${userId}:`, error);
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2003') {
                    throw new common_1.BadRequestException('Uno de los IDs de curso proporcionados no es válido o no existe.');
                }
                else if (error.code === 'P2025') {
                    throw new common_1.NotFoundException('Perfil de tutor no encontrado para actualizar.');
                }
            }
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Error al actualizar el perfil específico del tutor.');
        }
    }
    async getPublicTutorProfileById(userId) {
        this.logger.debug(`Fetching public tutor profile for userId: ${userId}`);
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
            include: {
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
        if (!user || !user.tutorProfile) {
            this.logger.warn(`Public tutor profile not found for userId: ${userId} (User exists: ${!!user}, TutorProfile exists: ${!!user?.tutorProfile})`);
            return null;
        }
        this.logger.debug(`Raw availability for tutorProfileId ${user.tutorProfile.id} (userId: ${userId}): ${JSON.stringify(user.tutorProfile.availability)}`);
        if (user.role !== client_1.Role.TUTOR && user.role !== client_1.Role.BOTH) {
            this.logger.warn(`User ${userId} has a tutor profile but an inconsistent role: ${user.role}`);
            return null;
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
        if (user.tutorProfile) {
            response.tutorProfile = {
                id: user.tutorProfile.id,
                bio: user.tutorProfile.bio,
                average_rating: user.tutorProfile.average_rating,
                cv_url: user.tutorProfile.cv_url,
                experience_details: user.tutorProfile.experience_details,
                tutoring_contact_email: user.tutorProfile.tutoring_contact_email,
                tutoring_phone: user.tutorProfile.tutoring_phone,
                university: user.tutorProfile.university,
                degree: user.tutorProfile.degree,
                academic_year: user.tutorProfile.academic_year,
                courses: user.tutorProfile.courses.map((tc) => ({
                    courseId: tc.courseId,
                    courseName: tc.course.name,
                    level: tc.level,
                    grade: tc.grade,
                })),
                availability: user.tutorProfile.availability.map((ab) => ({
                    id: ab.id,
                    day_of_week: ab.day_of_week,
                    start_time: formatTime(ab.start_time),
                    end_time: formatTime(ab.end_time),
                })),
            };
        }
        return response;
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = ProfileService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProfileService);
//# sourceMappingURL=profile.service.js.map