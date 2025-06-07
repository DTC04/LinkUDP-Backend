import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, DayOfWeek } from '@prisma/client';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  // 1. Ver bloques de un tutor
  async getTutorAvailability(tutorId: number) {
    return this.prisma.availabilityBlock.findMany({
      where: { tutorId },
      orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
    });
  }

  // 2. Crear nuevo bloque
  async createAvailabilityBlock(data: Prisma.AvailabilityBlockCreateInput) {
    return this.prisma.availabilityBlock.create({ data });
  }

  // 3. Editar un bloque existente
  async updateAvailabilityBlock(id: number, data: Prisma.AvailabilityBlockUpdateInput) {
    const exists = await this.prisma.availabilityBlock.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Bloque no encontrado');

    return this.prisma.availabilityBlock.update({ where: { id }, data });
  }

  // 4. Eliminar bloque
  async deleteAvailabilityBlock(id: number) {
    const exists = await this.prisma.availabilityBlock.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Bloque no encontrado');

    return this.prisma.availabilityBlock.delete({ where: { id } });
  }

  // Bloquear disponibilidad para una sesión confirmada
  async blockAvailabilityForSession(tutorId: number, start: Date, end: Date) {
    const days: DayOfWeek[] = [
      DayOfWeek.DOMINGO,
      DayOfWeek.LUNES,
      DayOfWeek.MARTES,
      DayOfWeek.MIERCOLES,
      DayOfWeek.JUEVES,
      DayOfWeek.VIERNES,
      DayOfWeek.SABADO,
    ];
    const dayOfWeek: DayOfWeek = days[start.getUTCDay()];
    const toTime = (d: Date) => new Date('1970-01-01T' + d.toISOString().split('T')[1]);
    const startTime = toTime(start);
    const endTime = toTime(end);

    const blocks = await this.prisma.availabilityBlock.findMany({
      where: { tutorId, day_of_week: dayOfWeek },
      orderBy: { start_time: 'asc' },
    });

    for (const block of blocks) {
      const bStart = block.start_time;
      const bEnd = block.end_time;

      if (endTime <= bStart || startTime >= bEnd) continue;

      if (startTime <= bStart && endTime >= bEnd) {
        await this.prisma.availabilityBlock.delete({ where: { id: block.id } });
      } else if (startTime <= bStart && endTime < bEnd) {
        await this.prisma.availabilityBlock.update({
          where: { id: block.id },
          data: { start_time: endTime },
        });
      } else if (startTime > bStart && endTime >= bEnd) {
        await this.prisma.availabilityBlock.update({
          where: { id: block.id },
          data: { end_time: startTime },
        });
      } else {
        await this.prisma.availabilityBlock.update({
          where: { id: block.id },
          data: { end_time: startTime },
        });
        await this.prisma.availabilityBlock.create({
          data: {
            tutorId,
            day_of_week: block.day_of_week,
            start_time: endTime,
            end_time: bEnd,
          },
        });
      }
    }
  }
}