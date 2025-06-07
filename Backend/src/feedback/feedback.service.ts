import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFeedbackDto, userId: number) {
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!studentProfile) {
      throw new ForbiddenException(
        'Solo los estudiantes pueden dejar retroalimentación',
      );
    }

    const session = await this.prisma.tutoringSession.findUnique({
      where: { id: dto.sessionId },
      include: { bookings: true },
    });

    if (!session) {
      throw new NotFoundException('Sesión no encontrada');
    }

    const studentParticipated = session.bookings.some(
      (booking) => booking.studentProfileId === studentProfile.id,
    );

    if (!studentParticipated) {
      throw new ForbiddenException('No participaste en esta tutoría.');
    }

    return this.prisma.feedback.create({
      data: {
        sessionId: dto.sessionId,
        authorId: studentProfile.id,
        rating: dto.rating,
        comment: dto.comment,
        is_public: false,
      },
    });
  }

  // 📊 Obtener promedio público de un tutor
  async getPublicRatings(tutorId: number) {
    const sessions = await this.prisma.tutoringSession.findMany({
      where: { tutorId },
      include: {
        feedbacks: true,
      },
    });

    const ratings = sessions.flatMap((session) =>
      session.feedbacks.map((f) => f.rating),
    );

    if (ratings.length === 0) {
      return {
        tutorId,
        averageRating: 0,
        totalRatings: 0,
      };
    }

    const average =
      ratings.reduce((a, b) => a + b, 0) / ratings.length;

    return {
      tutorId,
      averageRating: Number(average.toFixed(2)),
      totalRatings: ratings.length,
    };
  }
  async getPrivateCommentsForTutor(tutorId: number, userId: number) {
    const tutorProfile = await this.prisma.tutorProfile.findUnique({
      where: { id: tutorId },
      include: { user: true },
    });

    if (!tutorProfile || tutorProfile.userId !== userId) {
      throw new ForbiddenException(
        'No puedes ver los comentarios de otro tutor.',
      );
    }

    const sessions = await this.prisma.tutoringSession.findMany({
      where: { tutorId },
      include: {
        feedbacks: {
          where: {
            comment: {
              not: null,
            },
          },
          select: {
            comment: true,
            rating: true,
            created_at: true,
          },
        },
      },
    });

    const comments = sessions.flatMap((session) => session.feedbacks);

    return {
      tutorId,
      totalComments: comments.length,
      comments,
    };
  }
}
