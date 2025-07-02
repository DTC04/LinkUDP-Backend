import { Injectable, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 
import { CreateTutoriaDto } from './dto/create-tutoria.dto';
import { UpdateTutoriaDto } from './dto/update-tutoria.dto';
import { TutoringSession, Prisma, BookingStatus, User, NotificationPreference } from '@prisma/client'; 
import { MailerService } from '@nestjs-modules/mailer';
import { forbiddenWords } from '../config/forbidden-words';

@Injectable()
export class TutoriasService {
  private readonly logger = new Logger(TutoriasService.name);

  constructor(
    private prisma: PrismaService,
    private readonly mailerService: MailerService
  ) {}

  private validateText(text: string) {
    const lowerCaseText = text.toLowerCase();
    for (const word of forbiddenWords) {
      if (lowerCaseText.includes(word)) {
        throw new ForbiddenException(`El texto contiene palabras no permitidas: ${word}`);
      }
    }
  }

  async create(createTutoriaDto: CreateTutoriaDto): Promise<TutoringSession> {
    if (
      !createTutoriaDto.tutorId ||
      !createTutoriaDto.courseId ||
      !createTutoriaDto.title ||
      !createTutoriaDto.description ||
      !createTutoriaDto.date ||
      !createTutoriaDto.start_time ||
      !createTutoriaDto.end_time
    ) {
      throw new Error('Todos los campos son requeridos para publicar la tutoría.');
    }

    this.validateText(createTutoriaDto.title);
    this.validateText(createTutoriaDto.description);

    const startTime = new Date(createTutoriaDto.start_time);
    const sessionDate = new Date(Date.UTC(startTime.getUTCFullYear(), startTime.getUTCMonth(), startTime.getUTCDate()));

    return this.prisma.tutoringSession.create({
      data: {
        tutorId: createTutoriaDto.tutorId,
        courseId: createTutoriaDto.courseId,
        title: createTutoriaDto.title,
        description: createTutoriaDto.description,
        date: sessionDate,
        start_time: startTime,
        end_time: new Date(createTutoriaDto.end_time),
        location: createTutoriaDto.location,
        notes: createTutoriaDto.notes,
      },
    });
  }

  async findAll(
    ramo?: string,
    horario?: string, 
    tutorId?: number,
    status?: string | string[],
    upcoming?: boolean,
    limit?: number,
  ): Promise<TutoringSession[]> {
    const where: Prisma.TutoringSessionWhereInput = {};

    if (tutorId) {
      where.tutorId = tutorId;
    }

    if (status) {
      if (Array.isArray(status)) {
        const validStatuses = status.filter(s => Object.values(BookingStatus).includes(s as BookingStatus));
        if (validStatuses.length > 0) {
          where.status = { in: validStatuses as BookingStatus[] };
        }
      } else if (Object.values(BookingStatus).includes(status as BookingStatus)) {
        where.status = status as BookingStatus;
      }
    } else if (!tutorId) {
      where.status = { in: ['AVAILABLE', 'PENDING', 'CONFIRMED'] };
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
                user: {select: {full_name: true}}
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

  async findOne(id: number): Promise<TutoringSession | null> {
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
      throw new NotFoundException(`Tutoría con ID "${id}" no encontrada.`);
    }
    return tutoria;
  }

  async update(id: number, updateTutoriaDto: UpdateTutoriaDto): Promise<TutoringSession> {
    if (updateTutoriaDto.title) {
      this.validateText(updateTutoriaDto.title);
    }
    if (updateTutoriaDto.description) {
      this.validateText(updateTutoriaDto.description);
    }

    const { start_time, end_time, date, ...restOfDto } = updateTutoriaDto; // 'date' is explicitly extracted
    const dataToUpdate: Prisma.TutoringSessionUpdateInput = { ...restOfDto };

    if (start_time) {
      const newStartTime = new Date(start_time);
      dataToUpdate.start_time = newStartTime;
      // Always derive 'date' from 'start_time' if 'start_time' is provided
      dataToUpdate.date = new Date(Date.UTC(newStartTime.getUTCFullYear(), newStartTime.getUTCMonth(), newStartTime.getUTCDate()));
    } else if (date) {
      // This case is tricky. If only 'date' is provided without 'start_time',
      // it implies changing the date part of the existing start_time.
      // However, without knowing the existing start_time's time part, we can't accurately construct a new start_time.
      // For now, we'll update 'date' directly if 'start_time' is not provided.
      // This relies on the frontend sending 'date' as UTC midnight if it intends to change only the day.
      // A more robust solution would require fetching the existing session to combine the new date with existing time,
      // or disallowing 'date' updates without 'start_time'.
      // For simplicity and to match previous partial logic:
      dataToUpdate.date = new Date(date);
      // WARNING: This might lead to date and start_time becoming out of sync if not handled carefully by the client.
      // Ideally, client should always send start_time if the date changes.
    }

    if (end_time) {
      dataToUpdate.end_time = new Date(end_time);
    }

    // If 'date' was in updateTutoriaDto but 'start_time' was not,
    // and we updated dataToUpdate.date directly, we should log a warning or consider if this is desired.
    // For now, the above logic prioritizes start_time for eting date, then falls back to dto.date if start_time is absent.

    try {
      const updatedTutoria = await this.prisma.tutoringSession.update({
        where: { id },
        data: dataToUpdate,
        include: {
          course: true,
        }
      });

      // Notification logic
      const bookings = await this.prisma.booking.findMany({
        where: { 
          sessionId: id,
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] } 
        },
        include: {
          studentProfile: {
            include: {
              user: {
                include: {
                  NotificationPreference: true,
                }
              }
            }
          }
        }
      });

      for (const booking of bookings) {
        const studentUser = booking.studentProfile.user;
        if (studentUser) {
          const notificationPayload = {
            message: `La tutoría "${updatedTutoria.title}" de la asignatura "${updatedTutoria.course.name}" ha sido actualizada.`,
            details: `Fecha: ${updatedTutoria.start_time.toLocaleDateString()}, Hora: ${updatedTutoria.start_time.toLocaleTimeString()} - ${updatedTutoria.end_time.toLocaleTimeString()}`,
            tutoriaId: updatedTutoria.id,
          };

          // Create in-app notification
          await this.prisma.notification.create({
            data: {
              userId: studentUser.id,
              type: 'TUTORIA_UPDATED',
              payload: notificationPayload as unknown as Prisma.InputJsonValue,
            }
          });
          this.logger.log(`In-app notification created for user ${studentUser.id} for updated tutoria ${updatedTutoria.id}`);

          // Send email notification if preferred
          const prefs = studentUser.NotificationPreference;
          const shouldSendEmail = !prefs || prefs.email_on_cancellation !== false; 

          if (shouldSendEmail) {
            try {
              const emailSubject = `Actualización de Tutoría: ${updatedTutoria.title}`;
              const eventTime = new Date(updatedTutoria.start_time);
              const emailText = `Hola ${studentUser.full_name},\n\nLa tutoría "${updatedTutoria.title}" de la asignatura "${updatedTutoria.course.name}" ha sido actualizada.\nNuevos detalles:\nHorario: ${eventTime.toLocaleString()}\nDuración aproximada: ${(new Date(updatedTutoria.end_time).getTime() - eventTime.getTime()) / (1000 * 60)} minutos.\n\nPuedes ver los detalles en: ${process.env.FRONTEND_URL}/tutoring/${updatedTutoria.id}\n\nSaludos,\nEquipo LinkUDP`;
              
              await this.mailerService.sendMail({
                to: studentUser.email,
                subject: emailSubject,
                text: emailText,
              });
              this.logger.log(`Email notification successfully sent to ${studentUser.email} for updated tutoria ${updatedTutoria.id}`);
            } catch (emailError) {
              this.logger.error(`Failed to send update email to ${studentUser.email} for tutoria ${id}: ${emailError.message}`, emailError.stack);
            }
          }
        } else {
          this.logger.warn(`Student user not found for booking ID ${booking.id} during tutoria update ${updatedTutoria.id}. Skipping notifications for this booking.`);
        }
      }
      return updatedTutoria;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Tutoría con ID "${id}" no encontrada.`);
      }
      this.logger.error(`Error updating tutoria ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: number): Promise<TutoringSession> {
    // First, fetch booking details for notifications before deleting
    const tutoriaToDelete = await this.prisma.tutoringSession.findUnique({
      where: { id },
      include: {
        course: true,
        bookings: {
          where: {
            status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] }
          },
          include: {
            studentProfile: {
              include: {
                user: {
                  include: {
                    NotificationPreference: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!tutoriaToDelete) {
      throw new NotFoundException(`Tutoría con ID "${id}" no encontrada para eliminar.`);
    }

    // Send notifications
    for (const booking of tutoriaToDelete.bookings) {
      const studentUser = booking.studentProfile.user;
      if (studentUser) {
        const notificationPayload = {
          message: `La tutoría "${tutoriaToDelete.title}" de la asignatura "${tutoriaToDelete.course.name}" ha sido cancelada por el tutor.`,
          details: `Estaba programada para: ${tutoriaToDelete.start_time.toLocaleDateString()}, Hora: ${tutoriaToDelete.start_time.toLocaleTimeString()} - ${tutoriaToDelete.end_time.toLocaleTimeString()}`,
          tutoriaId: tutoriaToDelete.id,
        };

        await this.prisma.notification.create({
          data: {
            userId: studentUser.id,
            type: 'TUTORIA_CANCELLED_BY_TUTOR',
            payload: notificationPayload as unknown as Prisma.InputJsonValue,
          }
        });
        this.logger.log(`In-app notification created for user ${studentUser.id} for cancelled tutoria ${tutoriaToDelete.id}`);
        
        const prefs = studentUser.NotificationPreference;
        const shouldSendEmailCancellation = !prefs || prefs.email_on_cancellation !== false;

        if (shouldSendEmailCancellation) {
           try {
            const emailSubject = `Cancelación de Tutoría: ${tutoriaToDelete.title}`;
            const eventTimeCancelled = new Date(tutoriaToDelete.start_time);
            const emailText = `Hola ${studentUser.full_name},\n\nLamentamos informarte que la tutoría "${tutoriaToDelete.title}" de la asignatura "${tutoriaToDelete.course.name}", programada para ${eventTimeCancelled.toLocaleString()}, ha sido cancelada por el tutor.\n\nSaludos,\nEquipo LinkUDP`;

            await this.mailerService.sendMail({
              to: studentUser.email,
              subject: emailSubject,
              text: emailText,
            });
            this.logger.log(`Email notification successfully sent to ${studentUser.email} for cancelled tutoria ${tutoriaToDelete.id}`);
          } catch (emailError) {
            this.logger.error(`Failed to send cancellation email to ${studentUser.email} for tutoria ${id}: ${emailError.message}`, emailError.stack);
          }
        }
      }
    }

    await this.prisma.booking.deleteMany({
      where: { sessionId: id },
    });
    this.logger.log(`Bookings for session ${id} deleted before session deletion.`);

    try {
      return await this.prisma.tutoringSession.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Tutoría con ID "${id}" no encontrada.`);
      }
      throw error;
    }
  }

  async getRecommendedTutorings(userId?: number): Promise<TutoringSession[]> {
    console.log("📌 Obteniendo recomendaciones para el userId:", userId);
    const where: Prisma.TutoringSessionWhereInput = {
      status: { in: ['AVAILABLE', 'PENDING'] },
      start_time: { gt: new Date() },
    };
  
    const orderBy: Prisma.TutoringSessionOrderByWithRelationInput[] = [];
  
    if (userId) {
      const pastBookings = await this.prisma.booking.findMany({
        where: {
          studentProfile: { user: { id: userId } },
          status: { in: ['CONFIRMED'] },
        },
        include: {
          session: {
            select: {
              courseId: true,
              tutorId: true,
            },
          },
        },
      });
  
      const courseIds = [...new Set(pastBookings.map(b => b.session.courseId))];
      const tutorIds = [...new Set(pastBookings.map(b => b.session.tutorId))];
      
      where.OR = [
        { courseId: { in: courseIds } },
        { tutorId: { in: tutorIds } },
      ];
    } else {
      orderBy.push({ bookings: { _count: 'desc' } });
    }
  
    return this.prisma.tutoringSession.findMany({
      where,
      include: {
        course: true,
        tutor: { include: { user: true } },
      },
      orderBy,
      take: 6,
    });
  }
  




  // ------------- 🚀 NUEVO MÉTODO: CONTACTAR TUTOR 🚀 -------------
  async contactTutor(
    sessionId: number,
    studentUserId: number,
    message: string
  ): Promise<void> {
    this.validateText(message);
    // 1. Buscar la sesión y los datos relacionados
    const session = await this.prisma.tutoringSession.findUnique({
      where: { id: sessionId },
      include: {
        course: true,
        tutor: { include: { user: true } },
      },
    });

    if (!session) {
      throw new NotFoundException('Sesión de tutoría no encontrada.');
    }

    // 2. Buscar el perfil y usuario del estudiante
    const studentProfile = await this.prisma.studentProfile.findFirst({
      where: { userId: studentUserId },
      include: { user: true },
    });

    if (!studentProfile) {
      throw new NotFoundException('Perfil de estudiante no encontrado.');
    }

    // 3. Armar y enviar el correo
    const subject = `Mensaje sobre tu tutoría de ${session.course.name}`;
    const text = `
Hola ${session.tutor.user.full_name},

El estudiante ${studentProfile.user.full_name} (${studentProfile.user.email}) te ha enviado un mensaje sobre la tutoría de ${session.course.name.toUpperCase()} agendada para ${session.date.toLocaleDateString()}:

"${message}"

¡Por favor responde a la brevedad para coordinar!

— Plataforma LinkUDP
`;

    await this.mailerService.sendMail({
      to: session.tutor.user.email,
      subject,
      text,
    });

    this.logger.log(
      `Correo enviado al tutor ${session.tutor.user.email} desde el estudiante ${studentProfile.user.email} sobre la sesión ${session.id}`,
    );
  }

  async save(sessionId: number, userId: number) {
    return this.prisma.savedTutoring.create({
      data: {
        sessionId,
        userId,
      },
    });
  }

  async unsave(sessionId: number, userId: number) {
    return this.prisma.savedTutoring.delete({
      where: {
        userId_sessionId: {
          userId,
          sessionId,
        },
      },
    });
  }

  async getSaved(userId: number) {
    return this.prisma.savedTutoring.findMany({
      where: { userId },
      include: {
        session: {
          include: {
            tutor: {
              include: {
                user: true,
              },
            },
            course: true,
          },
        },
      },
    });
  }
  async getStudentsByTutoriaId(tutoriaId: string) {
    const sessionId = Number(tutoriaId);
    if (isNaN(sessionId)) {
      throw new NotFoundException('ID de tutoría inválido.');
    }

    const bookings = await this.prisma.booking.findMany({
      where: { sessionId },
      include: {
        studentProfile: {
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const ratings = await this.prisma.studentRating.findMany({
      where: { sessionId },
      select: { studentId: true, rating: true },
    });

    // Calcula el promedio global de cada estudiante
    return Promise.all(bookings.map(async (b) => {
      const ratingRecord = ratings.find(r => r.studentId === b.studentProfile.id);

      // Busca todas las calificaciones de este estudiante
      const allRatings = await this.prisma.studentRating.findMany({
        where: { studentId: b.studentProfile.id },
        select: { rating: true },
      });
      const averageRating =
        allRatings.length > 0
          ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
          : 0;

      return {
        id: b.studentProfile.id, // id del perfil de estudiante
        name: b.studentProfile.user.full_name,
        email: b.studentProfile.user.email,
        rating: ratingRecord?.rating ?? 0, // rating de ESTA sesión
        averageRating, // promedio global
        hasBeenRated: ratingRecord !== undefined,
      };
    }));
  }

  async rateStudent(sessionId: number, studentId: number, rating: number, tutorUserId: number) {
    // Busca la sesión y verifica que el usuario sea el tutor
    const session = await this.prisma.tutoringSession.findUnique({
      where: { id: sessionId },
      include: { tutor: true },
    });
    if (!session) throw new NotFoundException('Tutoría no encontrada');
    if (session.tutor.userId !== tutorUserId) throw new ForbiddenException('No autorizado');

    // Usa el id del perfil de tutor (no el userId)
    await this.prisma.studentRating.upsert({
      where: {
        sessionId_studentId_tutorId: {
          sessionId,
          studentId,
          tutorId: session.tutor.id,
        },
      },
      update: { rating },
      create: { sessionId, studentId, tutorId: session.tutor.id, rating },
    });
    return { success: true };
  }
}
