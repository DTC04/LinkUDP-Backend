import {
  Controller,
  Get,
  Query,
  UseGuards,
  UnauthorizedException,
  NotFoundException,
  ParseBoolPipe,
  Param,
  BadRequestException,
  HttpCode,
  Post,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User as UserModel, BookingStatus, Prisma, User } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly prisma: PrismaService,
  ) {}

  @Patch(':bookingId/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cancelar una reserva existente para el estudiante autenticado',
  })
  @ApiResponse({ status: 204, description: 'Reserva cancelada exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 403,
    description:
      'Acceso denegado (el usuario no es el dueño de la reserva o no puede cancelarla en este estado).',
  })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada.' })
  async cancelBooking(
    @GetUser() user: UserModel,
    @Param('bookingId') bookingId: string,
  ) {
    if (!user || !user.id) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }

    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!studentProfile) {
      throw new NotFoundException(
        'Perfil de estudiante no encontrado para el usuario autenticado.',
      );
    }

    const parsedBookingId = parseInt(bookingId, 10);
    if (isNaN(parsedBookingId)) {
      throw new BadRequestException('ID de reserva inválido.');
    }

    await this.bookingsService.cancelBooking(
      parsedBookingId,
      studentProfile.id,
    );
  }

  @Post(':sessionId/book')
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({
    status: 201,
    description: 'La tutoría ha sido agendada con éxito.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Sesión de tutoría no encontrada o perfil de estudiante no encontrado.',
  })
  @ApiResponse({
    status: 409,
    description:
      'La sesión de tutoría ya no está disponible o el estudiante ya tiene una reserva para esta sesión/superpuesta.',
  })
  async bookTutoringSession(
    @GetUser() user: User,
    @Param('sessionId') sessionId: string,
  ) {
    if (user.role !== 'STUDENT' && user.role !== 'BOTH') {
      throw new BadRequestException(
        'Solo los estudiantes pueden agendar tutorías.',
      );
    }

    const sessionIdNum = parseInt(sessionId, 10);
    if (isNaN(sessionIdNum)) {
      throw new BadRequestException('ID de sesión inválido.');
    }

    return this.bookingsService.createBooking(user.id, sessionIdNum);
  }

  @Get('me')
  @ApiOperation({ summary: 'Obtener las reservas del estudiante autenticado' })
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'Filtrar por estado de reserva (PENDING, CONFIRMED, CANCELLED, COMPLETED). Puede ser un string o un array.',
    type: String,
    isArray: true,
    enum: BookingStatus,
  })
  @ApiQuery({
    name: 'upcoming',
    required: false,
    description: 'Filtrar solo reservas futuras.',
    type: Boolean,
  })
  @ApiQuery({
    name: 'past',
    required: false,
    description: 'Filtrar solo reservas pasadas.',
    type: Boolean,
  })
  @ApiResponse({ status: 200, description: 'Reservas obtenidas exitosamente.' })
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({
    status: 404,
    description: 'Perfil de estudiante no encontrado.',
  })
  async getMyBookings(
    @GetUser() user: UserModel,
    @Query('status') statuses?: BookingStatus | BookingStatus[],
    @Query('upcoming', new ParseBoolPipe({ optional: true }))
    upcoming?: boolean,
    @Query('past', new ParseBoolPipe({ optional: true })) past?: boolean,
  ) {
    if (!user || !user.id) {
      throw new UnauthorizedException('Usuario no autenticado.');
    }

    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!studentProfile) {
      throw new NotFoundException(
        'Perfil de estudiante no encontrado para el usuario autenticado.',
      );
    }

    return this.bookingsService.findStudentBookings(
      studentProfile.id,
      statuses,
      upcoming,
      past,
    );
  }
}
