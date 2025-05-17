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
  // StudentProfile, // No se usa directamente como tipo de retorno o parámetro explícito aquí
  TutorProfile,
  Prisma,
  Role,
  // AvailabilityBlock, // No se usa directamente como tipo de retorno o parámetro explícito aquí
  // DayOfWeek, // No se usa directamente como tipo de retorno o parámetro explícito aquí
} from '@prisma/client';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import {
  UpdateTutorSpecificProfileDto,
  // AvailabilityBlockDto, // Ya está en update-tutor-specific-profile.dto.ts
  // TutorCourseDto, // Ya está en update-tutor-specific-profile.dto.ts
} from './dto/update-tutor-specific-profile.dto';
import { ViewUserProfileDto } from './dto/view-user-profile.dto';

function formatTime(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    // En caso de fecha inválida, devuelve un string que no cause error o maneja según necesidad.
    // Podría ser útil loguear este caso si no se espera.
    console.warn('formatTime recibió una fecha inválida:', date);
    return '00:00'; // Un valor por defecto o lanzar un error si es crítico.
  }
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
          start_time: formatTime(ab.start_time),
          end_time: formatTime(ab.end_time),
        })),
      };
    }
    return response;
  }

  async updateUserProfile(
    userId: number,
    dto: UpdateUserProfileDto,
  ): Promise<User> {
    // Considera devolver ViewUserProfileDto para consistencia

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
    if (full_name !== undefined) userToUpdate.full_name = full_name;
    if (photo_url !== undefined) userToUpdate.photo_url = photo_url;

    const studentProfileData: Prisma.StudentProfileUpdateInput = {};
    const tutorProfileData: Prisma.TutorProfileUpdateInput = {};

    if (bio !== undefined) {
      studentProfileData.bio = bio; // Bio para el perfil de estudiante
      // Si el usuario también es tutor, su bio se puede actualizar aquí o en updateTutorSpecificProfile
      tutorProfileData.bio = bio; // Bio para el perfil de tutor
    }
    if (university !== undefined) studentProfileData.university = university;
    if (career !== undefined) studentProfileData.career = career;
    if (study_year !== undefined) studentProfileData.study_year = study_year;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const currentUserData = await tx.user.findUnique({
          // Obtener datos actuales del usuario
          where: { id: userId },
          select: { studentProfile: true, tutorProfile: true },
        });

        if (!currentUserData) {
          throw new NotFoundException('Usuario no encontrado para actualizar.');
        }

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: userToUpdate,
        });

        if (currentUserData.studentProfile) {
          // Si existe perfil de estudiante
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
                  studentProfileId: currentUserData.studentProfile!.id,
                  courseId,
                })),
                skipDuplicates: true,
              });
            }
          }
        }

        if (currentUserData.tutorProfile && bio !== undefined) {
          // Si existe perfil de tutor y se envió 'bio'
          await tx.tutorProfile.update({
            where: { userId },
            data: { bio: tutorProfileData.bio }, // Actualiza el bio del tutor
          });
        }
        // Devuelve el usuario completo con sus perfiles actualizados
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
          // Error si un registro a actualizar no se encuentra
          throw new NotFoundException(
            'Usuario, perfil de estudiante o perfil de tutor no encontrado para actualizar.',
          );
        }
      }
      console.error('Error updating user profile:', error);
      throw new InternalServerErrorException(
        'Error al actualizar el perfil del usuario.',
      );
    }
  }

  async updateTutorSpecificProfile(
    userId: number,
    dto: UpdateTutorSpecificProfileDto,
  ): Promise<TutorProfile> {
    // Considera devolver ViewUserProfileDto para consistencia
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // Intentar obtener el perfil de tutor existente
    let tutorProfile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
    });

    const {
      bio,
      cv_url,
      experience_details,
      tutoring_contact_email,
      tutoring_phone,
      availability,
      courses,
    } = dto;

    // Si no existe el perfil de tutor, se crea uno.
    // Esto es clave para el flujo "Convertirse en Tutor".
    if (!tutorProfile) {
      tutorProfile = await this.prisma.tutorProfile.create({
        data: {
          userId: userId,
          bio: bio || '', // Asigna bio si viene en este DTO, sino default a string vacío
          // Otros campos por defecto para TutorProfile pueden ir aquí si son necesarios
        },
      });
    }

    const dataToUpdate: Prisma.TutorProfileUpdateInput = {};
    if (bio !== undefined) dataToUpdate.bio = bio;
    if (cv_url !== undefined) dataToUpdate.cv_url = cv_url;
    if (experience_details !== undefined)
      dataToUpdate.experience_details = experience_details;
    if (tutoring_contact_email !== undefined)
      dataToUpdate.tutoring_contact_email = tutoring_contact_email;
    if (tutoring_phone !== undefined)
      dataToUpdate.tutoring_phone = tutoring_phone;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Actualizar (o usar el recién creado) TutorProfile
        const updatedTutorProfile = await tx.tutorProfile.update({
          where: { id: tutorProfile!.id }, // tutorProfile no será null aquí
          data: dataToUpdate,
        });

        // 2. Lógica para actualizar el rol del usuario si es necesario
        if (currentUser.role === Role.STUDENT) {
          await tx.user.update({
            where: { id: userId },
            data: { role: Role.BOTH }, // Cambiar rol a BOTH
          });
        }
        // Si el rol ya era TUTOR o BOTH, no se necesita cambio explícito aquí.

        // 3. Gestionar AvailabilityBlocks (reemplazar todos)
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
              const baseDate = '1970-01-01T'; // Fecha base para almacenar solo la hora en UTC
              return {
                tutorId: updatedTutorProfile.id,
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

        // 4. Gestionar TutorCourses (reemplazar todos)
        if (courses !== undefined) {
          await tx.tutorCourse.deleteMany({
            where: { tutorId: updatedTutorProfile.id },
          });
          if (courses.length > 0) {
            const tutorCoursesData = courses.map((courseDto) => ({
              tutorId: updatedTutorProfile.id,
              courseId: courseDto.courseId,
              level: courseDto.level,
              grade: courseDto.grade !== undefined ? courseDto.grade : 0, // Default grade si no se proporciona
            }));
            await tx.tutorCourse.createMany({ data: tutorCoursesData });
          }
        }

        // Recargar el perfil de tutor con todas las relaciones actualizadas para la respuesta
        return tx.tutorProfile.findUniqueOrThrow({
          where: { id: updatedTutorProfile.id },
          include: {
            courses: { include: { course: true } },
            availability: true,
            user: true, // Incluir el usuario para ver el rol actualizado en la respuesta
          },
        });
      });
    } catch (error) {
      console.error('Error updating tutor specific profile:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          // Foreign key constraint failed
          throw new BadRequestException(
            'Uno de los IDs de curso proporcionados no es válido o no existe.',
          );
        } else if (error.code === 'P2025') {
          // An operation failed because it depends on one or more records that were required but not found.
          throw new NotFoundException(
            'Perfil de tutor no encontrado para actualizar. Esto no debería suceder si la creación/búsqueda inicial fue exitosa.',
          );
        }
      }
      throw new InternalServerErrorException(
        'Error al actualizar el perfil específico del tutor.',
      );
    }
  }
}
