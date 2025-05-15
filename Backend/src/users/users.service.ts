import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStudentProfileDto } from './dto/create-student-profile.dto';
import { CreateTutorProfileDto } from './dto/create-tutor-profile.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { UpdateTutorProfileDto } from './dto/update-tutor-profile.dto';
import { DayOfWeek } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Obtener el perfil del usuario autenticado
  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: {
          include: {
            interests: {
              include: { course: true },
            },
          },
        },
        tutorProfile: {
          include: {
            availabilities: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  // Crear perfil de estudiante
  async createStudentProfile(userId: number, data: CreateStudentProfileDto) {
    return this.prisma.studentProfile.create({
      data: {
        userId,
        university: data.university,
        career: data.career,
        study_year: data.study_year,
        bio: data.bio,
        interests: {
          create: data.interests?.map((id) => ({
            course: { connect: { id } },
          })) || [],
        },
      },
    });
  }

  // Crear perfil de tutor
  async createTutorProfile(userId: number, data: CreateTutorProfileDto) {
    const tutor = await this.prisma.tutorProfile.create({
      data: {
        userId,
        bio: data.bio,
      },
    });

    if (data.availabilities?.length) {
      await this.prisma.availabilityBlock.createMany({
        data: data.availabilities.map((a) => ({
          tutorId: tutor.id,
          day_of_week: a.day_of_week as DayOfWeek,
          start_time: new Date(a.start_time),
          end_time: new Date(a.end_time),
        })),
      });
    }

    return tutor;
  }

  // Actualizar perfil de estudiante
  async updateStudentProfile(userId: number, data: UpdateStudentProfileDto) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!student) throw new NotFoundException('Perfil de estudiante no encontrado');

    // Actualizar campos del perfil
    const updated = await this.prisma.studentProfile.update({
      where: { userId },
      data: {
        university: data.university,
        career: data.career,
        study_year: data.study_year,
        bio: data.bio,
      },
    });

    // Actualizar intereses
    if (data.interests) {
      await this.prisma.studentInterest.deleteMany({ where: { studentProfileId: student.id } });

      await this.prisma.studentInterest.createMany({
        data: data.interests.map((courseId) => ({
          studentProfileId: student.id,
          courseId,
        })),
      });
    }

    return updated;
  }

  // Actualizar perfil de tutor
  async updateTutorProfile(userId: number, data: UpdateTutorProfileDto) {
    const tutor = await this.prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (!tutor) throw new NotFoundException('Perfil de tutor no encontrado');

    const updated = await this.prisma.tutorProfile.update({
      where: { userId },
      data: {
        bio: data.bio,
      },
    });

    // Reemplazar disponibilidad
    if (data.availability) {
      await this.prisma.availabilityBlock.deleteMany({ where: { tutorId: tutor.id } });

      await this.prisma.availabilityBlock.createMany({
        data: data.availability.map((a) => ({
          tutorId: tutor.id,
          day_of_week: a.day_of_week as DayOfWeek,
          start_time: new Date(a.start_time),
          end_time: new Date(a.end_time),
        })),
      });
    }

    return updated;
  }
}
