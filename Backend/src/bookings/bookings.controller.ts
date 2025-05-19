import {
  Controller,
  Get,
  Query,
  UseGuards,
  UnauthorizedException,
  NotFoundException,
  ParseBoolPipe,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User as UserModel, BookingStatus, Prisma } from '@prisma/client'; 
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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

  @Get('me')
  @ApiOperation({ summary: "Obtener las reservas del estudiante autenticado" })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por estado de reserva (PENDING, CONFIRMED, CANCELLED, COMPLETED). Puede ser un string o un array.', type: String, isArray: true, enum: BookingStatus })
  @ApiQuery({ name: 'upcoming', required: false, description: 'Filtrar solo reservas futuras.', type: Boolean })
  @ApiQuery({ name: 'past', required: false, description: 'Filtrar solo reservas pasadas.', type: Boolean })
  @ApiResponse({ status: 200, description: 'Reservas obtenidas exitosamente.'})
  @ApiResponse({ status: 401, description: 'No autorizado.' })
  @ApiResponse({ status: 404, description: 'Perfil de estudiante no encontrado.' })
  async getMyBookings(
    @GetUser() user: UserModel,
    @Query('status') statuses?: BookingStatus | BookingStatus[],
    @Query('upcoming', new ParseBoolPipe({ optional: true })) upcoming?: boolean,
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
