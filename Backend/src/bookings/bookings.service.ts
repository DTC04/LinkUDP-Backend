import { Injectable, NotFoundException } from '@nestjs/common';
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

}
