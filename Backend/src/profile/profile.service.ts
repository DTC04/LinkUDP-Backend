// Backend/src/profile/profile.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger, // Añadido Logger si no estaba
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  User, // No es necesario importar TutorProfile aquí si no se usa directamente
  Prisma,
  Role,
  TutorProfile,
  // DayOfWeek, // No es necesario importar si se usa solo en DTOs
} from '@prisma/client';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UpdateTutorSpecificProfileDto } from './dto/update-tutor-specific-profile.dto';
// Importar los sub-DTOs si se usan explícitamente en el payload de los métodos del servicio.
// import { AvailabilityBlockDto as AvailabilityBlockInputDto } from './dto/availability-block.dto';
// import { TutorCourseDto as TutorCourseInputDto } from './dto/tutor-course.dto';
import { ViewUserProfileDto } from './dto/view-user-profile.dto';

// La función formatTime ya la tienes
function formatTime(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    // console.warn('formatTime recibió una fecha inválida:', date); // Puedes habilitar este log si es útil
    return '00:00'; // O manejar el error de otra forma
  }
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name); // Instancia del logger
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
          // TutorProfile se incluye completo aquí
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
        id: user.studentProfile.id, // Si ViewUserProfileDto.StudentProfileViewDto tiene id
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
        id: user.tutorProfile.id, // El ID del TutorProfile
        bio: user.tutorProfile.bio,
        average_rating: user.tutorProfile.average_rating,
        cv_url: user.tutorProfile.cv_url,
        experience_details: user.tutorProfile.experience_details,
        tutoring_contact_email: user.tutorProfile.tutoring_contact_email,
        tutoring_phone: user.tutorProfile.tutoring_phone,
        // --- INCLUIR NUEVOS CAMPOS EN LA RESPUESTA ---
        university: user.tutorProfile.university,
        degree: user.tutorProfile.degree,
        academic_year: user.tutorProfile.academic_year,
        // --------------------------------------------
        courses: user.tutorProfile.courses.map((tc) => ({
          // id: tc.id, // Si ViewUserProfileDto.TutorCourseViewDto tiene id (de la relación)
          courseId: tc.courseId,
          courseName: tc.course.name,
          level: tc.level,
          grade: tc.grade,
        })),
        availability: user.tutorProfile.availability.map((ab) => ({
          id: ab.id, // Si ViewUserProfileDto.AvailabilityBlockViewDto tiene id
          day_of_week: ab.day_of_week,
          start_time: ab.start_time.toISOString(),
          end_time: ab.end_time.toISOString(),
        })),
      };
    }
    return response;
  }

  async updateUserProfile(
    userId: number,
    dto: UpdateUserProfileDto,
  ): Promise<User> {
    // El controller lo convierte a ViewUserProfileDto
    this.logger.debug(
      `Updating user profile for userId: ${userId}, DTO: ${JSON.stringify(dto)}`,
    );
    const {
      full_name,
      photo_url,
      bio, // Bio general
      university, // Para StudentProfile
      career, // Para StudentProfile
      study_year, // Para StudentProfile
      interestCourseIds,
    } = dto;

    const userToUpdate: Prisma.UserUpdateInput = {};
    if (full_name !== undefined) userToUpdate.full_name = full_name;
    if (photo_url !== undefined) userToUpdate.photo_url = photo_url;

    // Datos para perfiles específicos
    const studentProfileUpdateData: Prisma.StudentProfileUpdateWithoutUserInput =
      {};
    const tutorProfileUpdateData: Prisma.TutorProfileUpdateWithoutUserInput =
      {};

    if (bio !== undefined) {
      // Este bio se considera el general y se propaga a ambos perfiles si existen.
      studentProfileUpdateData.bio = bio;
      tutorProfileUpdateData.bio = bio;
    }

    // Campos específicos de StudentProfile
    if (university !== undefined)
      studentProfileUpdateData.university = university;
    if (career !== undefined) studentProfileUpdateData.career = career;
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
          throw new NotFoundException('Usuario no encontrado para actualizar.');
        }

        // Actualizar User
        await tx.user.update({
          where: { id: userId },
          data: userToUpdate,
        });

        // Actualizar StudentProfile si existe y hay datos para él
        if (
          currentUser.studentProfile &&
          (bio !== undefined ||
            university !== undefined ||
            career !== undefined ||
            study_year !== undefined)
        ) {
          await tx.studentProfile.update({
            where: { userId },
            data: studentProfileUpdateData,
          });
        }
        // Manejar intereses de estudiante
        if (currentUser.studentProfile && interestCourseIds !== undefined) {
          await tx.studentInterest.deleteMany({
            where: { studentProfileId: currentUser.studentProfile.id },
          });
          if (interestCourseIds.length > 0) {
            // Aquí deberías verificar que los courseId son válidos antes de crear
            // Por simplicidad, se asume que son válidos.
            await tx.studentInterest.createMany({
              data: interestCourseIds.map((courseId) => ({
                studentProfileId: currentUser.studentProfile!.id, // El ! asume que studentProfileId siempre estará si studentProfile existe
                courseId,
              })),
              skipDuplicates: true,
            });
          }
        }

        // Actualizar TutorProfile.bio si existe y se proveyó bio
        if (currentUser.tutorProfile && bio !== undefined) {
          await tx.tutorProfile.update({
            where: { userId },
            data: { bio: tutorProfileUpdateData.bio }, // Solo actualiza bio desde aquí
          });
        }

        // El controlador es responsable de llamar a getMyProfile para la respuesta final.
        // Devolvemos el User actualizado para que el controller pueda usar su ID.
        return tx.user.findUniqueOrThrow({ where: { id: userId } });
      });
    } catch (error) {
      this.logger.error(
        `Error en updateUserProfile para userId ${userId}:`,
        error,
      );
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // "Record to update not found"
          throw new NotFoundException(
            'Usuario o perfil asociado no encontrado para actualizar.',
          );
        }
      }
      throw new InternalServerErrorException(
        'Error al actualizar el perfil del usuario.',
      );
    }
  }

  async updateTutorSpecificProfile(
    userId: number,
    dto: UpdateTutorSpecificProfileDto,
  ): Promise<TutorProfile> {
    // El controller lo convierte a ViewUserProfileDto
    this.logger.debug(
      `Updating tutor specific profile for userId: ${userId}, DTO: ${JSON.stringify(dto)}`,
    );

    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!currentUser) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    let tutorProfile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
    });

    // Si el usuario es STUDENT pero está intentando actualizar perfil de tutor (ej. al cambiar de rol)
    // y no tiene TutorProfile, créalo.
    if (
      !tutorProfile &&
      (currentUser.role === Role.TUTOR ||
        currentUser.role === Role.BOTH ||
        dto.bio !== undefined) /* indica intención de ser tutor */
    ) {
      this.logger.log(
        `Perfil de tutor no encontrado para userId: ${userId}. Creando nuevo TutorProfile.`,
      );
      try {
        tutorProfile = await this.prisma.tutorProfile.create({
          data: {
            userId: userId,
            bio: dto.bio || '', // Bio del DTO específico o vacío
            // Asignar valores por defecto o del DTO para los nuevos campos si es el primer setup
            university: dto.university,
            degree: dto.degree,
            academic_year: dto.academic_year,
            cv_url: dto.cv_url,
            experience_details: dto.experience_details,
            tutoring_contact_email: dto.tutoring_contact_email,
            tutoring_phone: dto.tutoring_phone,
            // ... otros campos si tienen defaults o vienen del DTO
          },
        });
        // Si se crea el perfil de tutor para un usuario que era solo STUDENT, actualiza su rol a BOTH
        if (currentUser.role === Role.STUDENT) {
          this.logger.log(
            `Cambiando rol de STUDENT a BOTH para userId: ${userId} al crear TutorProfile.`,
          );
          await this.prisma.user.update({
            where: { id: userId },
            data: { role: Role.BOTH },
          });
        }
      } catch (e) {
        this.logger.error(
          `Error creando TutorProfile para userId ${userId}:`,
          e,
        );
        throw new InternalServerErrorException(
          'Error al inicializar el perfil de tutor.',
        );
      }
    } else if (!tutorProfile) {
      throw new NotFoundException(
        'Perfil de tutor no encontrado y no se pudo determinar la intención de crearlo.',
      );
    }

    // Extraer campos, incluyendo los nuevos
    const {
      bio, // Bio específico del tutor, puede sobreescribir el general si se envía aquí.
      cv_url,
      experience_details,
      tutoring_contact_email,
      tutoring_phone,
      // --- NUEVOS CAMPOS ---
      university,
      degree,
      academic_year,
      // -------------------
      availability,
      courses,
    } = dto;

    const dataToUpdate: Prisma.TutorProfileUpdateInput = {};
    if (bio !== undefined) dataToUpdate.bio = bio; // Bio específico del tutor
    if (cv_url !== undefined) dataToUpdate.cv_url = cv_url;
    if (experience_details !== undefined)
      dataToUpdate.experience_details = experience_details;
    if (tutoring_contact_email !== undefined)
      dataToUpdate.tutoring_contact_email = tutoring_contact_email;
    if (tutoring_phone !== undefined)
      dataToUpdate.tutoring_phone = tutoring_phone;
    // --- AÑADIR NUEVOS CAMPOS AL OBJETO DE ACTUALIZACIÓN ---
    if (university !== undefined) dataToUpdate.university = university;
    if (degree !== undefined) dataToUpdate.degree = degree;
    if (academic_year !== undefined) dataToUpdate.academic_year = academic_year;
    // ----------------------------------------------------

    try {
      return await this.prisma.$transaction(async (tx) => {
        const updatedTutorProfile = await tx.tutorProfile.update({
          where: { id: tutorProfile!.id }, // Usamos el ID del tutorProfile encontrado o recién creado
          data: dataToUpdate,
        });

        // Si el usuario era STUDENT y se actualizó su perfil de tutor, cambiar rol a BOTH
        // Esto ya se maneja arriba si el perfil se crea. Aquí es por si el perfil ya existía
        // y el rol del usuario no estaba sincronizado (aunque AuthService debería manejar esto en el registro).
        if (currentUser.role === Role.STUDENT) {
          const userBeingUpdated = await tx.user.findUnique({
            where: { id: userId },
          });
          if (userBeingUpdated && userBeingUpdated.role === Role.STUDENT) {
            // Doble chequeo por si acaso
            this.logger.log(
              `Cambiando rol de STUDENT a BOTH para userId: ${userId} durante actualización de TutorProfile.`,
            );
            await tx.user.update({
              where: { id: userId },
              data: { role: Role.BOTH },
            });
          }
        }

        // Gestión de AvailabilityBlocks (reemplazar todos)
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
              const baseDate = '1970-01-01T'; // Para almacenar solo el tiempo en UTC
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

        // Gestión de TutorCourses (reemplazar todos)
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
              const notFoundIds = courseIds.filter(
                (id) => !existingCourses.find((ec) => ec.id === id),
              );
              this.logger.warn(
                `Algunos courseId no fueron encontrados: ${notFoundIds.join(', ')}`,
              );
              throw new BadRequestException(
                `Los siguientes IDs de curso no son válidos: ${notFoundIds.join(', ')}`,
              );
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

        // El controlador llama a getMyProfile después, por lo que este tipo de retorno TutorProfile es interno.
        // Devolvemos el TutorProfile actualizado para que el controller pueda usar su ID si es necesario,
        // o para que el controller sepa que la operación fue exitosa.
        return tx.tutorProfile.findUniqueOrThrow({
          where: { id: updatedTutorProfile.id },
          // Incluir relaciones para consistencia si el controller usara este retorno directamente
          // pero como llama a getMyProfile, esto es menos crítico.
          include: {
            courses: { include: { course: true } },
            availability: true,
          },
        });
      });
    } catch (error) {
      this.logger.error(
        `Error en updateTutorSpecificProfile para userId ${userId}:`,
        error,
      );
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          // Foreign key constraint failed
          throw new BadRequestException(
            'Uno de los IDs de curso proporcionados no es válido o no existe.',
          );
        } else if (error.code === 'P2025') {
          // Record to update not found
          throw new NotFoundException(
            'Perfil de tutor no encontrado para actualizar.',
          );
        }
      }
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error al actualizar el perfil específico del tutor.',
      );
    }
  }

  async getPublicTutorProfileById(
    userId: number,
  ): Promise<ViewUserProfileDto | null> {
    this.logger.debug(`Fetching public tutor profile for userId: ${userId}`);
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
        // Ensure we are fetching a user who is actually a tutor
        // OR (role: Role.TUTOR, role: Role.BOTH) - This is implicitly handled by checking tutorProfile existence
      },
      include: {
        // No studentProfile needed for public tutor view usually
        tutorProfile: {
          include: {
            courses: {
              include: {
                course: { select: { name: true, id: true } },
              },
            },
            availability: true, // Assuming availability is public
          },
        },
      },
    });

    if (!user || !user.tutorProfile) {
      // If user not found, or user found but has no tutorProfile
      this.logger.warn(
        `Public tutor profile not found for userId: ${userId} (User exists: ${!!user}, TutorProfile exists: ${!!user?.tutorProfile})`,
      );
      return null;
    }

    this.logger.debug(
      `Raw availability for tutorProfileId ${user.tutorProfile.id} (userId: ${userId}): ${JSON.stringify(user.tutorProfile.availability)}`,
    );

    // Double check role, although presence of tutorProfile should imply TUTOR or BOTH
    if (user.role !== Role.TUTOR && user.role !== Role.BOTH) {
      this.logger.warn(
        `User ${userId} has a tutor profile but an inconsistent role: ${user.role}`,
      );
      // Depending on business logic, you might still return the profile or treat as not found.
      // For now, let's treat as not found if role is not TUTOR/BOTH.
      return null;
    }

    const response: ViewUserProfileDto = {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email, // Consider if public email should be tutor_contact_email
        role: user.role,
        photo_url: user.photo_url,
        email_verified: user.email_verified, // Usually not public
      },
      // studentProfile is not included for public tutor view
    };

    if (user.tutorProfile) {
      response.tutorProfile = {
        id: user.tutorProfile.id,
        bio: user.tutorProfile.bio,
        average_rating: user.tutorProfile.average_rating, // May or may not be public
        cv_url: user.tutorProfile.cv_url, // Usually not public
        experience_details: user.tutorProfile.experience_details,
        tutoring_contact_email: user.tutorProfile.tutoring_contact_email,
        tutoring_phone: user.tutorProfile.tutoring_phone, // Usually not public
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
          id: ab.id, // Ensure the ID from the database is included
          day_of_week: ab.day_of_week,
          start_time: ab.start_time.toISOString(),
          end_time: ab.end_time.toISOString(),
        })),
      };
    }
    return response;
  }
}
