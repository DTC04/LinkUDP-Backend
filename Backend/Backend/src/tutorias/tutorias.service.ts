import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Asumiendo que tienes un servicio de Prisma
import { CreateTutoriaDto } from './dto/create-tutoria.dto';
import { UpdateTutoriaDto } from './dto/update-tutoria.dto';
import { TutoringSession, Prisma } from '@prisma/client';

@Injectable()
export class TutoriasService {
  constructor(private prisma: PrismaService) {}

  async create(createTutoriaDto: CreateTutoriaDto): Promise<TutoringSession> {
    // Validar que todos los campos estén completos antes de publicar
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
        // status se establece por defecto a AVAILABLE según el schema
      },
    });
  }

  async findAll(ramo?: string, horario?: string): Promise<TutoringSession[]> {
    const where: Prisma.TutoringSessionWhereInput = {
      status: 'AVAILABLE', // Solo mostrar tutorías disponibles
    };

    if (ramo) {
      where.course = {
        name: {
          contains: ramo,
          mode: 'insensitive',
        },
      };
    }

    // El filtro por horario es más complejo y puede requerir lógica adicional
    // dependiendo de cómo se almacenen y consulten los horarios.
    // Por ahora, este es un placeholder.
    if (horario) {
      // Ejemplo: si 'horario' es un día específico como "LUNES"
      // Esto asume que tienes una forma de relacionar 'horario' con 'day_of_week' en AvailabilityBlock
      // y luego filtrar TutoringSession basadas en eso.
      // Esta parte necesitará una implementación más detallada basada en tu modelo de datos exacto.
      console.warn('El filtro por horario aún no está completamente implementado.');
    }

    return this.prisma.tutoringSession.findMany({
      where,
      include: {
        tutor: {
          include: {
            user: true, // Para obtener el perfil del tutor
          },
        },
        course: true, // Para obtener el nombre del ramo
      },
    });
  }

  async findOne(id: number): Promise<TutoringSession | null> {
    const tutoria = await this.prisma.tutoringSession.findUnique({
      where: { id },
      include: {
        tutor: {
          include: {
            user: { // Para obtener full_name, email, photo_url del User asociado al TutorProfile
              select: {
                full_name: true,
                email: true,
                photo_url: true,
              }
            },
            // Aquí puedes incluir otros campos de TutorProfile si son necesarios
          },
        },
        course: true, // Para obtener detalles del curso/ramo
        // Considera si necesitas incluir AvailabilityBlock aquí o manejarlo por separado
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
