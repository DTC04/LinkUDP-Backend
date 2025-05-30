import {Controller, Get,Post,Put,Delete,Param,Body,ParseIntPipe,} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { Prisma } from '@prisma/client';

@Controller('disponibilidad')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // Ver todos los bloques de un tutor
  @Get(':tutorId')
  getAvailability(@Param('tutorId', ParseIntPipe) tutorId: number) {
    return this.availabilityService.getTutorAvailability(tutorId);
  }

  // Crear nuevo bloque
  @Post()
  createBlock(@Body() dto: CreateAvailabilityDto) {
    return this.availabilityService.createAvailabilityBlock({
      tutor: { connect: { id: dto.tutorId } },
      day_of_week: dto.day_of_week,
      start_time: new Date(dto.start_time),
      end_time: new Date(dto.end_time),
    });
  }

  // Editar bloque existente
  @Put(':id')
    updateBlock(
      @Param('id', ParseIntPipe) id: number,
      @Body() dto: UpdateAvailabilityDto
    ) {
      const data: any = {};
      if (dto.day_of_week) data.day_of_week = dto.day_of_week;
      if (dto.start_time) data.start_time = new Date(dto.start_time);
      if (dto.end_time) data.end_time = new Date(dto.end_time);

      return this.availabilityService.updateAvailabilityBlock(id, data);
    }
  // Eliminar bloque
  @Delete(':id')
  deleteBlock(@Param('id', ParseIntPipe) id: number) {
    return this.availabilityService.deleteAvailabilityBlock(id);
  }
}
