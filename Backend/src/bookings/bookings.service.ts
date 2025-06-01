import { MailerService } from '@nestjs-modules/mailer';
@Injectable()
export class BookingService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly prisma: PrismaService,
  ) { }

}
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
  constructor(private prisma: PrismaService, private mailerService: MailerService,) { }

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
      // Obtener datos del estudiante 
      const studentUser = await tx.user.findUnique({
        where: { id: studentUserId },
        select: { email: true, full_name: true },
      });

      if (studentUser?.email) {
        await this.mailerService.sendMail({
          to: studentUser.email,
          subject: 'Confirmación de reserva de tutoría',
          text: `Hola ${studentUser.full_name}, tu reserva para la sesión de tutoría que comienza el ${tutoringSession.start_time.toLocaleString()} ha sido creada y está pendiente de confirmación.`,
        });
      }

      return booking;
    });
  }

  async cancelBooking(
    bookingId: number,
    profileId: number,
    profileType: 'student' | 'tutor',
  ): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { session: true },
      });

      if (!booking) {
        throw new NotFoundException('Reserva no encontrada.');
      }

      // Verifica permisos
      if (
        (profileType === 'student' && booking.studentProfileId !== profileId) ||
        (profileType === 'tutor' && booking.session.tutorId !== profileId)
      ) {
        throw new ForbiddenException('No tienes permiso para cancelar esta reserva.');
      }

      if (booking.status === BookingStatus.CANCELLED) {
        throw new ConflictException('Esta reserva ya ha sido cancelada.');
      }

      const now = new Date();
      if (booking.session.start_time < now) {
        throw new BadRequestException('No se puede cancelar una tutoría que ya ha comenzado o terminado.');
      }

      // Cancela el booking
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      // Si la sesión estaba PENDING o CONFIRMED y cancela el estudiante, vuelve a AVAILABLE
      if (
        profileType === 'student' &&
        (booking.session.status === BookingStatus.PENDING || booking.session.status === BookingStatus.CONFIRMED)
      ) {
        await tx.tutoringSession.update({
          where: { id: booking.sessionId },
          data: { status: BookingStatus.AVAILABLE },
        });
      }
      // Si cancela el tutor y la sesión estaba PENDING, también vuelve a AVAILABLE
      else if (
        profileType === 'tutor' &&
        booking.session.status === BookingStatus.PENDING
      ) {
        await tx.tutoringSession.update({
          where: { id: booking.sessionId },
          data: { status: BookingStatus.AVAILABLE },
        });
      }
    });
  }

  async confirmBooking(bookingId: number, tutorProfileId: number): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { session: true },
      });

      if (!booking) {
        throw new NotFoundException('Reserva no encontrada.');
      }

      // Verifica que el perfil de tutor autenticado sea el tutor de la sesión
      if (booking.session.tutorId !== tutorProfileId) {
        throw new ForbiddenException('No tienes permiso para confirmar esta reserva.');
      }

      if (booking.status !== BookingStatus.PENDING) {
        throw new ConflictException('Solo puedes confirmar reservas pendientes.');
      }

      // Actualiza el estado del booking
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
      });

      // Opcional: actualizar el estado de la sesión si lo necesitas
      await tx.tutoringSession.update({
        where: { id: booking.sessionId },
        data: { status: BookingStatus.CONFIRMED },
      });
    });
  }

  async confirmBookingBySession(sessionId: number, tutorProfileId: number): Promise<void> {
    const booking = await this.prisma.booking.findFirst({
      where: {
        sessionId,
        status: BookingStatus.PENDING,
        session: { tutorId: tutorProfileId },
      },
      include: { session: true },
    });
    if (!booking) throw new NotFoundException('No hay solicitud pendiente para esta tutoría.');
    await this.confirmBooking(booking.id, tutorProfileId);
  }

  async cancelBookingBySession(sessionId: number, tutorProfileId: number, profileType: 'student' | 'tutor'): Promise<void> {
    const booking = await this.prisma.booking.findFirst({
      where: {
        sessionId,
        status: BookingStatus.PENDING,
        session: { tutorId: tutorProfileId },
      },
      include: { session: true },
    });
    if (!booking) throw new NotFoundException('No hay solicitud pendiente para esta tutoría.');
    await this.cancelBooking(booking.id, tutorProfileId, profileType);
  }
}
