import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUrl,
  IsArray,
  IsInt,
  ArrayMinSize,
  Min,
  MaxLength,
} from 'class-validator';

export class StudentInterestDto {
  @ApiPropertyOptional({
    description:
      'ID del interés (para eliminar o actualizar, no usado en creación directa aquí)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiPropertyOptional({ description: 'ID del curso de interés', example: 5 })
  @IsInt()
  courseId: number;
}

export class UpdateUserProfileDto {
  @ApiPropertyOptional({
    description: 'Nombre completo del usuario',
    example: 'Juan Alberto Pérez González',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name?: string;

  @ApiPropertyOptional({
    description: 'URL de la foto de perfil del usuario',
    example: 'https://example.com/profile.jpg',
  })
  @IsOptional()
  @IsUrl()
  photo_url?: string;

  @ApiPropertyOptional({
    description:
      'Biografía o descripción personal del usuario. Para tutores, esta es su bio principal.',
    example:
      'Estudiante de Ingeniería Civil Industrial apasionado por la optimización.',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  // Campos específicos para StudentProfile (solo si el usuario tiene rol STUDENT o BOTH)
  @ApiPropertyOptional({
    description: 'Universidad del estudiante (si aplica)',
    example: 'Universidad Diego Portales',
  })
  @IsOptional()
  @IsString()
  university?: string;

  @ApiPropertyOptional({
    description: 'Carrera del estudiante (si aplica)',
    example: 'Ingeniería Civil Informática',
  })
  @IsOptional()
  @IsString()
  career?: string;

  @ApiPropertyOptional({
    description: 'Año de estudio del estudiante (si aplica)',
    example: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  study_year?: number;

  @ApiPropertyOptional({
    description:
      'Lista de IDs de cursos de interés para el estudiante. Enviar la lista completa para reemplazar la existente.',
    example: [1, 5, 10],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(0) // Puede ser un array vacío para quitar todos los intereses
  interestCourseIds?: number[];
}
