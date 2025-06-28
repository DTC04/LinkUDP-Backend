import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  // 1. Ver bloques de un tutor
  async getTutorAvailability(tutorId: number) {
    return this.prisma.availabilityBlock.findMany({
      where: { tutorId },
      orderBy: { start_time: 'asc' },
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
    const blocks = await this.prisma.availabilityBlock.findMany({
      where: {
        tutorId,
        start_time: { lt: end },
        end_time: { gt: start },
      },
      orderBy: { start_time: 'asc' },
    });

    for (const block of blocks) {
      const bStart = block.start_time;
      const bEnd = block.end_time;

      if (end <= bStart || start >= bEnd) continue;

      if (start <= bStart && end >= bEnd) {
        await this.prisma.availabilityBlock.delete({ where: { id: block.id } });
      } else if (start <= bStart && end < bEnd) {
        await this.prisma.availabilityBlock.update({
          where: { id: block.id },
          data: { start_time: end },
        });
      } else if (start > bStart && end >= bEnd) {
        await this.prisma.availabilityBlock.update({
          where: { id: block.id },
          data: { end_time: start },
        });
      } else {
        await this.prisma.availabilityBlock.update({
          where: { id: block.id },
          data: { end_time: start },
        });
        await this.prisma.availabilityBlock.create({
          data: {
            tutorId,
            day_of_week: block.day_of_week,
            start_time: end,
            end_time: bEnd,
          },
        });
      }
    }
  }
}