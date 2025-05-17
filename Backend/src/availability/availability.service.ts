import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async getTutorAvailability(tutorId: number) {
    const blocks = await this.prisma.availabilityBlock.findMany({
      where: { tutorId },
      orderBy: [{ day_of_week: 'asc' }, { start_time: 'asc' }],
      select: {
        day_of_week: true,
        start_time: true,
        end_time: true
      }
    });

    return blocks.map((b) => ({
      day_of_week: b.day_of_week,
      start_time: b.start_time.toISOString().slice(11, 16),
      end_time: b.end_time.toISOString().slice(11, 16)
    }));
  }
}
