import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsDateString, IsOptional } from 'class-validator';

export class CreateTutoriaDto {
  @ApiProperty({ description: 'ID del tutor que crea la tutoría', example: 1 })
  @IsInt()
  @IsNotEmpty()
  tutorId: number;

  @ApiProperty({ description: 'ID del curso (ramo) asociado a la tutoría', example: 1 })
  @IsInt()
  @IsNotEmpty()
  courseId: number;

  @ApiProperty({ description: 'Título de la tutoría', example: 'Clase de Cálculo Avanzado' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Descripción detallada de la tutoría', example: 'Repaso de derivadas e integrales.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Fecha de la tutoría', example: '2025-06-15T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  date: string; // Se mantiene como string para facilitar la entrada, Prisma lo manejará como DateTime

  @ApiProperty({ description: 'Hora de inicio de la tutoría', example: '2025-06-15T10:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  start_time: string; // Se mantiene como string

  @ApiProperty({ description: 'Hora de finalización de la tutoría', example: '2025-06-15T12:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  end_time: string; // Se mantiene como string

  @ApiProperty({ description: 'Ubicación de la tutoría (opcional si es online)', example: 'Sala H-305', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Notas adicionales para la tutoría (opcional)', example: 'Traer calculadora', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
