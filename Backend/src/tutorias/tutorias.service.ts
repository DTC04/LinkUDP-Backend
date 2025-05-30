import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 
import { CreateTutoriaDto } from './dto/create-tutoria.dto';
import { UpdateTutoriaDto } from './dto/update-tutoria.dto';
import { TutoringSession, Prisma, BookingStatus } from '@prisma/client'; 

@Injectable()
export class TutoriasService {
  constructor(private prisma: PrismaService) {}

  async create(createTutoriaDto: CreateTutoriaDto): Promise<TutoringSession> {
    if (
      !createTutoriaDto.tutorId ||
      !createTutoriaDto.courseId ||
      !createTutoriaDto.title ||
      !createTutoriaDto.description ||
      !createTutoriaDto.date ||
      !createTutoriaDto.start_time ||
      !createTutoriaDto.end_time
    ) {
      throw new Error('Todos los campos son requeridos para publicar la tutoría.');
    }

    return this.prisma.tutoringSession.create({
      data: {
        tutorId: createTutoriaDto.tutorId,
        courseId: createTutoriaDto.courseId,
        title: createTutoriaDto.title,
        description: createTutoriaDto.description,
        date: new Date(createTutoriaDto.date),
        start_time: new Date(createTutoriaDto.start_time),
        end_time: new Date(createTutoriaDto.end_time),
        location: createTutoriaDto.location,
        notes: createTutoriaDto.notes,
      },
    });
  }

  async findAll(
    ramo?: string,
    horario?: string, 
    tutorId?: number,
    status?: string | string[],
    upcoming?: boolean,
    limit?: number,
  ): Promise<TutoringSession[]> {
    const where: Prisma.TutoringSessionWhereInput = {};

    if (tutorId) {
      where.tutorId = tutorId;
    }

    if (status) {
      if (Array.isArray(status)) {
        const validStatuses = status.filter(s => Object.values(BookingStatus).includes(s as BookingStatus));
        if (validStatuses.length > 0) {
          where.status = { in: validStatuses as BookingStatus[] };
        }
      } else if (Object.values(BookingStatus).includes(status as BookingStatus)) {
        where.status = status as BookingStatus;
      }
    } else if (!tutorId) {
      where.status = 'AVAILABLE';
    }


    if (ramo) {
      where.course = {
        name: {
          contains: ramo,
          mode: 'insensitive',
        },
      };
    }
    
    if (upcoming) {
      where.start_time = {
        gt: new Date(), 
      };
    }

    if (horario) {
      console.warn('El filtro por horario aún no está completamente implementado.');
    }

    return this.prisma.tutoringSession.findMany({
      where,
      take: limit, 
      include: {
        tutor: {
          include: {
            user: { 
              select: { id: true, full_name: true, email: true, photo_url: true }, // Added id: true
            }
            
          }
        },
        course: true,
        bookings: { 
          include: {
            studentProfile: {
              include: {
                user: {select: {full_name: true}}
              }
            }
          }
        }
      },
      orderBy: {
        start_time: 'asc', 
      },
    });
  }

  async findOne(id: number): Promise<TutoringSession | null> {
    const tutoria = await this.prisma.tutoringSession.findUnique({
      where: { id },
      include: {
        tutor: { 
          include: {
            user: {
              select: {
                id: true, // Added id: true
                full_name: true,
                email: true, 
                photo_url: true,
              }
            }
            
          }
        },
        course: true, 
      },
    });
    if (!tutoria) {
      throw new NotFoundException(`Tutoría con ID "${id}" no encontrada.`);
    }
    return tutoria;
  }

  async update(id: number, updateTutoriaDto: UpdateTutoriaDto): Promise<TutoringSession> {
    const { date, start_time, end_time, ...restOfDto } = updateTutoriaDto;
    const dataToUpdate: Prisma.TutoringSessionUpdateInput = { ...restOfDto };

    if (date) {
      dataToUpdate.date = new Date(date);
    }
    if (start_time) {
      dataToUpdate.start_time = new Date(start_time);
    }
    if (end_time) {
      dataToUpdate.end_time = new Date(end_time);
    }

    try {
      return await this.prisma.tutoringSession.update({
        where: { id },
        data: dataToUpdate,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Tutoría con ID "${id}" no encontrada.`);
      }
      throw error;
    }
  }

  async remove(id: number): Promise<TutoringSession> {
    try {
      return await this.prisma.tutoringSession.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Tutoría con ID "${id}" no encontrada.`);
      }
      throw error;
    }
  }
}