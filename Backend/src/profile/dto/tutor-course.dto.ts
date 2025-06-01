import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class TutorCourseDto {
  @ApiPropertyOptional({
    description: 'ID de la relación TutorCourse (solo para actualizaciones)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ description: 'ID del curso (ramo)', example: 10 })
  @IsInt()
  @IsNotEmpty()
  courseId: number;

  @ApiProperty({
    description: 'Nivel en el que imparte el curso',
    example: 'Avanzado',
  })
  @IsString()
  @IsNotEmpty()
  level: string; // Podría ser un enum si tienes niveles predefinidos

  @ApiPropertyOptional({
    description: 'Calificación obtenida en el curso por el tutor (opcional)',
    example: 6.5,
    minimum: 1.0,
    maximum: 7.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(1.0)
  @Max(7.0)
  grade?: number;
}
