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

  // 5. Cambiar Estado cuando se conecte status en el futuro
}
