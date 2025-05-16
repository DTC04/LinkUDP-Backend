// src/profile/profile.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  User,
  StudentProfile,
  TutorProfile,
  Prisma,
  Role,
  AvailabilityBlock,
  DayOfWeek,
} from '@prisma/client';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import {
  UpdateTutorSpecificProfileDto,
  AvailabilityBlockDto as AvailabilityBlockInputDto,
  TutorCourseDto as TutorCourseInputDto,
} from './dto/update-tutor-specific-profile.dto';
import { ViewUserProfileDto } from './dto/view-user-profile.dto'; // Asegúrate de crear este DTO

function formatTime(date: Date): string {
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async getMyProfile(userId: number): Promise<ViewUserProfileDto> {
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
      throw new NotFoundException('Usuario no encontrado');
    }

    // Mapeo a ViewUserProfileDto
    const response: ViewUserProfileDto = {
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
          start_time: formatTime(ab.start_time), // Asumiendo que start_time y end_time son DateTime
          end_time: formatTime(ab.end_time), // y quieres devolver HH:MM
        })),
      };
    }
    return response;
  }

  async updateUserProfile(
    userId: number,
    dto: UpdateUserProfileDto,
  ): Promise<User> {
    const {
      full_name,
      photo_url,
      bio,
      university,
      career,
      study_year,
      interestCourseIds,
    } = dto;

    const userToUpdate: Prisma.UserUpdateInput = {};
    if (full_name) userToUpdate.full_name = full_name;
    if (photo_url) userToUpdate.photo_url = photo_url;
    // El bio general se puede actualizar en User o en StudentProfile/TutorProfile
    // Por simplicidad, si es un tutor, actualizamos TutorProfile.bio, si es student, StudentProfile.bio
    // Si solo es User (sin perfil específico), no hay bio en el modelo User directamente.
    // Vamos a asumir que el 'bio' en UpdateUserProfileDto se refiere al bio del perfil específico si existe.

    const studentProfileData: Prisma.StudentProfileUpdateInput = {};
    const tutorProfileData: Prisma.TutorProfileUpdateInput = {};

    if (bio) {
      studentProfileData.bio = bio;
      tutorProfileData.bio = bio; // Actualizar en ambos por si el rol es BOTH
    }
    if (university) studentProfileData.university = university;
    if (career) studentProfileData.career = career;
    if (study_year) studentProfileData.study_year = study_year;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: userToUpdate,
          include: { studentProfile: true, tutorProfile: true },
        });

        if (updatedUser.studentProfile) {
          await tx.studentProfile.update({
            where: { userId },
            data: studentProfileData,
          });

          if (interestCourseIds !== undefined) {
            // Permite enviar array vacío para borrar
            // Eliminar intereses existentes
            await tx.studentInterest.deleteMany({
              where: { studentProfileId: updatedUser.studentProfile.id },
            });
            // Crear nuevos intereses si se proporcionan
            if (interestCourseIds.length > 0) {
              await tx.studentInterest.createMany({
                data: interestCourseIds.map((courseId) => ({
                  studentProfileId: updatedUser.studentProfile!.id,
                  courseId,
                })),
                skipDuplicates: true, // Por si acaso, aunque la lógica anterior elimina primero
              });
            }
          }
        }

        if (updatedUser.tutorProfile && bio) {
          // Solo actualiza bio del tutor si se proporcionó
          await tx.tutorProfile.update({
            where: { userId },
            data: { bio: tutorProfileData.bio },
          });
        }
        // Recargar el usuario con todas las inclusiones para la respuesta
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            'Usuario o perfil no encontrado para actualizar.',
          );
        }
      }
      console.error('Error updating user profile:', error);
      throw new InternalServerErrorException('Error al actualizar el perfil.');
    }
  }

  async updateTutorSpecificProfile(
    userId: number,
    dto: UpdateTutorSpecificProfileDto,
  ): Promise<TutorProfile> {
    const tutorProfile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
    });
    if (!tutorProfile) {
      throw new NotFoundException(
        'Perfil de tutor no encontrado para este usuario.',
      );
    }

    const {
      cv_url,
      experience_details,
      tutoring_contact_email,
      tutoring_phone,
      availability,
      courses,
    } = dto;

    const dataToUpdate: Prisma.TutorProfileUpdateInput = {};
    if (cv_url !== undefined) dataToUpdate.cv_url = cv_url;
    if (experience_details !== undefined)
      dataToUpdate.experience_details = experience_details;
    if (tutoring_contact_email !== undefined)
      dataToUpdate.tutoring_contact_email = tutoring_contact_email;
    if (tutoring_phone !== undefined)
      dataToUpdate.tutoring_phone = tutoring_phone;
    // El 'bio' principal del tutor se maneja en updateUserProfile

    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Actualizar campos directos de TutorProfile
        const updatedTutorProfile = await tx.tutorProfile.update({
          where: { id: tutorProfile.id },
          data: dataToUpdate,
        });

        // 2. Gestionar AvailabilityBlocks (reemplazar todos)
        if (availability !== undefined) {
          await tx.availabilityBlock.deleteMany({
            where: { tutorId: tutorProfile.id },
          });
          if (availability.length > 0) {
            const availabilityData = availability.map((block) => {
              const [startHour, startMinute] = block.start_time
                .split(':')
                .map(Number);
              const [endHour, endMinute] = block.end_time
                .split(':')
                .map(Number);

              // Crear fechas UTC para almacenar solo la hora. El día es manejado por day_of_week
              // Usamos una fecha base (ej. 1970-01-01) y le asignamos la hora UTC
              const baseDate = '1970-01-01T';
              return {
                tutorId: tutorProfile.id,
                day_of_week: block.day_of_week,
                start_time: new Date(
                  `${baseDate}${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00.000Z`,
                ),
                end_time: new Date(
                  `${baseDate}${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00.000Z`,
                ),
              };
            });
            await tx.availabilityBlock.createMany({ data: availabilityData });
          }
        }

        // 3. Gestionar TutorCourses (reemplazar todos)
        if (courses !== undefined) {
          await tx.tutorCourse.deleteMany({
            where: { tutorId: tutorProfile.id },
          });
          if (courses.length > 0) {
            const tutorCoursesData = courses.map((courseDto) => ({
              tutorId: tutorProfile.id,
              courseId: courseDto.courseId,
              level: courseDto.level,
              grade: courseDto.grade !== undefined ? courseDto.grade : 0, // Default to 0 or another valid number
            }));
            await tx.tutorCourse.createMany({ data: tutorCoursesData });
          }
        }
        // Recargar el perfil de tutor con las relaciones para la respuesta
        return tx.tutorProfile.findUniqueOrThrow({
          where: { id: tutorProfile.id },
          include: {
            courses: { include: { course: true } },
            availability: true,
            user: true,
          },
        });
      });
    } catch (error) {
      console.error('Error updating tutor specific profile:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Manejar errores específicos de Prisma, ej. P2003 por courseId inválido
        if (error.code === 'P2003') {
          // Foreign key constraint failed
          throw new BadRequestException(
            'Uno de los IDs de curso proporcionados no es válido.',
          );
        }
      }
      throw new InternalServerErrorException(
        'Error al actualizar el perfil específico del tutor.',
      );
    }
  }
}
