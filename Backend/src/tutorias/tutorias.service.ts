import { Injectable, NotFoundException, UnauthorizedException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTutoriaDto } from './dto/create-tutoria.dto';
import { UpdateTutoriaDto } from './dto/update-tutoria.dto';
import { TutoringSession, Prisma, BookingStatus, User } from '@prisma/client';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
// import { EmailService } from '../email/email.service'; // Placeholder for EmailService

@Injectable()
export class TutoriasService {
  constructor(
    private prisma: PrismaService,
    @Inject(REQUEST) private request: Request,
    // private emailService: EmailService, // Placeholder for EmailService
  ) {}

  private getAuthenticatedUserId(): number {
    const user = this.request.user as User & { id: number }; // Adjust based on how user is stored in request
    if (!user || !user.id) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }
    return user.id;
  }

  async create(createTutoriaDto: CreateTutoriaDto): Promise<TutoringSession> {
    const authenticatedUserId = this.getAuthenticatedUserId();
    if (createTutoriaDto.tutorId !== authenticatedUserId) {
      throw new UnauthorizedException('No puedes crear tutorías para otro tutor.');
    }

    // Validation for required fields is good, but let's ensure dates are valid if provided
    const startDate = new Date(createTutoriaDto.start_time);
    const endDate = new Date(createTutoriaDto.end_time);
    const sessionDate = new Date(createTutoriaDto.date);

    if (startDate <= new Date() || sessionDate <= new Date()) {
      throw new BadRequestException('La fecha y hora de la tutoría no pueden ser en el pasado.');
    }
    if (startDate >= endDate) {
      throw new BadRequestException('La hora de inicio debe ser anterior a la hora de finalización.');
    }


    return this.prisma.tutoringSession.create({
      data: {
        tutorId: authenticatedUserId, // Use authenticated user's ID
        courseId: createTutoriaDto.courseId,
        title: createTutoriaDto.title,
        description: createTutoriaDto.description,
        date: sessionDate,
        start_time: startDate,
        end_time: endDate,
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
    } else if (!tutorId) { // If no specific tutorId is requested, and no specific status, show AVAILABLE and PENDING
      where.status = { in: [BookingStatus.AVAILABLE, BookingStatus.PENDING] };
    }
    // If tutorId is provided but no status, it will fetch all statuses for that tutor, which is fine for "Mis Tutorías"


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
                user: {select: {full_name: true, email: true}} // Also get student email for notifications
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
        bookings: { // Include bookings to check for notifications
          where: {
            status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] }
          },
          include: {
            studentProfile: {
              include: {
                user: { select: { email: true, full_name: true } }
              }
            }
          }
        }
      },
    });
    if (!tutoria) {
      throw new NotFoundException(`Tutoría con ID "${id}" no encontrada.`);
    }
    return tutoria;
  }

  async update(id: number, updateTutoriaDto: UpdateTutoriaDto): Promise<TutoringSession> {
    const authenticatedUserId = this.getAuthenticatedUserId();

    const tutoria = await this.prisma.tutoringSession.findUnique({
      where: { id },
      include: {
        bookings: {
          where: { status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] } },
          include: { studentProfile: { include: { user: { select: { email: true, full_name: true } } } } }
        }
      }
    });

    if (!tutoria) {
      throw new NotFoundException(`Tutoría con ID "${id}" no encontrada.`);
    }

    if (tutoria.tutorId !== authenticatedUserId) {
      throw new UnauthorizedException('No tienes permiso para actualizar esta tutoría.');
    }

    const { date, start_time, end_time, ...restOfDto } = updateTutoriaDto;
    const dataToUpdate: Prisma.TutoringSessionUpdateInput = { ...restOfDto };

    let newDate: Date | undefined;
    let newStartTime: Date | undefined;
    let newEndTime: Date | undefined;

    if (date) {
      newDate = new Date(date);
      dataToUpdate.date = newDate;
    }
    if (start_time) {
      newStartTime = new Date(start_time);
      dataToUpdate.start_time = newStartTime;
    }
    if (end_time) {
      newEndTime = new Date(end_time);
      dataToUpdate.end_time = newEndTime;
    }
    
    const effectiveStartTime = newStartTime || tutoria.start_time;
    const effectiveEndTime = newEndTime || tutoria.end_time;
    const effectiveDate = newDate || tutoria.date;


    if (effectiveStartTime <= new Date() || effectiveDate <= new Date()) {
      throw new BadRequestException('La fecha y hora de la tutoría no pueden ser en el pasado.');
    }
    if (effectiveStartTime >= effectiveEndTime) {
      throw new BadRequestException('La hora de inicio debe ser anterior a la hora de finalización.');
    }

    // Notify students if critical fields change
    const changedFields: string[] = [];
    if (updateTutoriaDto.date && new Date(updateTutoriaDto.date).toISOString() !== tutoria.date.toISOString()) changedFields.push("fecha");
    if (updateTutoriaDto.start_time && new Date(updateTutoriaDto.start_time).toISOString() !== tutoria.start_time.toISOString()) changedFields.push("hora de inicio");
    if (updateTutoriaDto.end_time && new Date(updateTutoriaDto.end_time).toISOString() !== tutoria.end_time.toISOString()) changedFields.push("hora de fin");
    if (updateTutoriaDto.location && updateTutoriaDto.location !== tutoria.location) changedFields.push("ubicación");
    if (updateTutoriaDto.description && updateTutoriaDto.description !== tutoria.description) changedFields.push("descripción");


    if (changedFields.length > 0 && tutoria.bookings && tutoria.bookings.length > 0) {
      for (const booking of tutoria.bookings) {
        if (booking.studentProfile?.user?.email) {
          console.log(`INFO: Notificando a ${booking.studentProfile.user.email} sobre cambios en la tutoría '${tutoria.title}'. Cambios: ${changedFields.join(', ')}`);
          // await this.emailService.sendTutoriaUpdatedEmail(
          //   booking.studentProfile.user.email,
          //   tutoria,
          //   updateTutoriaDto
          // );
        }
      }
    }

    try {
      return await this.prisma.tutoringSession.update({
        where: { id },
        data: dataToUpdate,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Tutoría con ID "${id}" no encontrada.`);
      }
      throw error;
    }
  }

  async remove(id: number): Promise<TutoringSession> {
    const authenticatedUserId = this.getAuthenticatedUserId();

    const tutoria = await this.prisma.tutoringSession.findUnique({
      where: { id },
      include: {
        bookings: {
          where: { status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] } },
          include: { studentProfile: { include: { user: { select: { email: true, full_name: true } } } } }
        }
      }
    });

    if (!tutoria) {
      throw new NotFoundException(`Tutoría con ID "${id}" no encontrada.`);
    }

    if (tutoria.tutorId !== authenticatedUserId) {
      throw new UnauthorizedException('No tienes permiso para eliminar esta tutoría.');
    }

    // Notify students about cancellation if there are relevant bookings
    if (tutoria.bookings && tutoria.bookings.length > 0) { // tutoria.bookings here only contains PENDING/CONFIRMED ones due to include
      for (const booking of tutoria.bookings) {
        if (booking.studentProfile?.user?.email) {
           console.log(`INFO: Notificando a ${booking.studentProfile.user.email} sobre la cancelación de la tutoría '${tutoria.title}'.`);
          // await this.emailService.sendTutoriaCancelledEmail(
          //   booking.studentProfile.user.email,
          //   tutoria 
          // );
        }
      }
    }

    // Always attempt to delete associated records regardless of what was included in tutoria.bookings
    // This ensures all bookings and feedback for the session are removed.
    await this.prisma.booking.deleteMany({
      where: { sessionId: id },
    });
    
    await this.prisma.feedback.deleteMany({
      where: { sessionId: id },
    });

    try {
      // Now delete the tutoring session
      return await this.prisma.tutoringSession.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // This case should ideally be caught by the findUnique above, but good to have as a fallback.
        throw new NotFoundException(`Tutoría con ID "${id}" no encontrada durante la eliminación.`);
      }
      throw error;
    }
  }
}
