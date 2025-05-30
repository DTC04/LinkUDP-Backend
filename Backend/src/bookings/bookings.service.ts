import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Booking, Prisma, BookingStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async findStudentBookings(
    studentProfileId: number,
    statuses?: BookingStatus | BookingStatus[],
    upcoming?: boolean,
    past?: boolean,
  ): Promise<Booking[]> {
    const where: Prisma.BookingWhereInput = {
      studentProfileId: studentProfileId,
    };

    if (statuses) {
      if (Array.isArray(statuses)) {
        where.status = { in: statuses };
      } else {
        where.status = statuses;
      }
    }

    const sessionDateFilter: Prisma.TutoringSessionWhereInput = {};
    if (upcoming) {
      sessionDateFilter.start_time = { gt: new Date() };
    }
    if (past) {
      sessionDateFilter.start_time = { lt: new Date() };
    }

    if (upcoming || past) {
      where.session = sessionDateFilter;
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        session: {
          include: {
            course: true,
            tutor: {
              include: {
                user: {
                  select: {
                    full_name: true,
                    photo_url: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        session: {
          start_time: upcoming ? 'asc' : 'desc',
        },
      },
    });
  }

  async createBooking(
    studentUserId: number,
    sessionId: number,
  ): Promise<Booking> {
    return this.prisma.$transaction(async (tx) => {
      // Encontrar el perfil del estudiante para el usuario autenticado
      const studentProfile = await tx.studentProfile.findUnique({
        where: { userId: studentUserId },
        select: { id: true },
      });

      if (!studentProfile) {
        throw new NotFoundException(
          'Perfil de estudiante no encontrado para el usuario autenticado.',
        );
      }

      //  Verificar si la sesión de tutoría existe y está disponible
      const tutoringSession = await tx.tutoringSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          status: true,
          tutorId: true,
          start_time: true,
          end_time: true,
        },
      });

      if (!tutoringSession) {
        throw new NotFoundException('Sesión de tutoría no encontrada.');
      }

      if (tutoringSession.status !== BookingStatus.AVAILABLE) {
        // Usar TutoringSessionStatus
        throw new ConflictException(
          'Esta sesión de tutoría ya no está disponible para reservar.',
        );
      }

      //  Opcional: Verificar si el estudiante ya ha reservado esta sesión o alguna otra en el mismo horario
      const existingBookingForStudent = await tx.booking.findFirst({
        where: {
          studentProfileId: studentProfile.id,
          sessionId: sessionId,
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
          },
        },
      });

      if (existingBookingForStudent) {
        throw new ConflictException('Ya tienes una reserva para esta sesión.');
      }

      // Opcional: Verificar si el estudiante ya tiene otra reserva CONFIRMED/PENDING que se superponga con esta sesión.
      const overlappingBooking = await tx.booking.findFirst({
        where: {
          studentProfileId: studentProfile.id,
          status: {
            in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
          },
          session: {
            OR: [
              {
                start_time: {
                  lt: tutoringSession.end_time,
                },
                end_time: {
                  gt: tutoringSession.start_time,
                },
              },
            ],
          },
        },
      });

      if (overlappingBooking) {
        throw new ConflictException(
          'Ya tienes una tutoría agendada que se superpone con este horario.',
        );
      }

      // Crear la reserva
      const booking = await tx.booking.create({
        data: {
          sessionId: tutoringSession.id,
          studentProfileId: studentProfile.id,
          status: BookingStatus.PENDING,
        },
      });

      // Actualizar el estado de la sesión de tutoría
      await tx.tutoringSession.update({
        where: { id: sessionId },
        data: { status: BookingStatus.PENDING }, // Cambiar a BOOKED
      });

      // Puedes añadir lógica para notificar al tutor aquí (e.g., usando un módulo de notificación o un servicio de correo electrónico)

      return booking;
    });
  }

  async cancelBooking(
    bookingId: number,
    studentProfileId: number,
  ): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { session: true }, // Incluir la sesión para poder actualizar su estado
      });

      if (!booking) {
        throw new NotFoundException('Reserva no encontrada.');
      }

      //  Verificar que el estudiante que intenta cancelar sea el dueño de la reserva
      if (booking.studentProfileId !== studentProfileId) {
        throw new ForbiddenException(
          'No tienes permiso para cancelar esta reserva.',
        );
      }

      //  Verificar que la reserva esté en un estado cancelable
      // Solo se pueden cancelar si están PENDING o CONFIRMED y no si ya pasó la fecha.
      if (booking.status === BookingStatus.CANCELLED) {
        throw new ConflictException('Esta reserva ya ha sido cancelada.');
      }
      // if (booking.status === BookingStatus.COMPLETED) {
      //   throw new ConflictException(
      //     'Esta reserva ya ha sido completada y no se puede cancelar.',
      //   );
      // }

      // Opcional: Se puede añadir una regla para no cancelar si la sesión es muy pronto (ej. menos de 1 hora antes)
      const now = new Date();
      if (booking.session.start_time < now) {
        throw new BadRequestException(
          'No se puede cancelar una tutoría que ya ha comenzado o terminado.',
        );
      }
      // O si quieres una política de cancelación con tiempo límite:
      // const cancellationCutoff = new Date(booking.session.start_time.getTime() - (60 * 60 * 1000)); // 1 hora antes
      // if (now > cancellationCutoff) {
      //    throw new BadRequestException('No se puede cancelar la tutoría con menos de 1 hora de antelación.');
      // }

      //  Actualizar el estado de la reserva a CANCELLED
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      // Actualizar el estado de la TutoringSession (como es un cupo único)
      // Si la sesión de tutoría estaba en PENDING (por ser reservada por esta única persona)
      // y ahora esta reserva se cancela, la sesión vuelve a estar AVAILABLE.
      // Esta lógica es crucial para el modelo de un solo cupo.
      if (booking.session.status === BookingStatus.PENDING) {
        await tx.tutoringSession.update({
          where: { id: booking.sessionId },
          data: { status: BookingStatus.AVAILABLE }, // La sesión vuelve a estar disponible
        });
      }
    });
  }
}
