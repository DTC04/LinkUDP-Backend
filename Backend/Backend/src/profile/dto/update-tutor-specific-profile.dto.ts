import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
  IsPhoneNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AvailabilityBlockDto } from './availability-block.dto';
import { TutorCourseDto } from './tutor-course.dto';

export class UpdateTutorSpecificProfileDto {
  @ApiPropertyOptional({
    description:
      'URL del Currículum Vitae del tutor (ej. LinkedIn, Google Drive)',
    example: 'https://linkedin.com/in/tutorudp',
  })
  @IsOptional()
  @IsUrl()
  cv_url?: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada de la experiencia del tutor',
    example: 'Más de 5 años de experiencia en tutorías de cálculo y álgebra.',
  })
  @IsOptional()
  @IsString()
  experience_details?: string;

  @ApiPropertyOptional({
    description: 'Email de contacto específico para tutorías',
    example: 'tutor.calculo@example.com',
  })
  @IsOptional()
  @IsEmail()
  tutoring_contact_email?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono para tutorías (opcional, formato chileno)',
    example: '+56912345678',
  })
  @IsOptional()
  @IsPhoneNumber('CL') // Valida para Chile, ajusta si es necesario
  tutoring_phone?: string;

  @ApiPropertyOptional({
    type: [AvailabilityBlockDto],
    description:
      'Lista de bloques de disponibilidad del tutor. Enviar la lista completa para reemplazar la existente.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityBlockDto)
  availability?: AvailabilityBlockDto[];

  @ApiPropertyOptional({
    type: [TutorCourseDto],
    description:
      'Lista de cursos que el tutor imparte. Enviar la lista completa para reemplazar la existente.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TutorCourseDto)
  courses?: TutorCourseDto[];
}
export { AvailabilityBlockDto, TutorCourseDto };
