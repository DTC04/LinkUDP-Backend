// src/profile/dto/update-tutor-specific-profile.dto.ts
import {
  IsString,
  IsOptional,
  IsUrl,
  IsEmail,
  IsPhoneNumber,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsEnum,
  IsNumber, // Asegúrate de importar IsNumber si lo usas para courseId o grade
  Min, // Para validaciones de números
  Max, // Para validaciones de números
} from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from '@prisma/client';

// Definición de AvailabilityBlockDto
export class AvailabilityBlockDto {
  @IsNotEmpty({ message: 'El día de la semana no puede estar vacío.' })
  @IsEnum(DayOfWeek, { message: 'El día de la semana no es válido.' })
  day_of_week: DayOfWeek;

  @IsNotEmpty({ message: 'La hora de inicio no puede estar vacía.' })
  @IsString()
  // Puedes añadir @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'El formato de hora de inicio debe ser HH:MM' })
  start_time: string;

  @IsNotEmpty({ message: 'La hora de término no puede estar vacía.' })
  @IsString()
  // Puedes añadir @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'El formato de hora de término debe ser HH:MM' })
  end_time: string;
}

// Definición de TutorCourseDto
export class TutorCourseDto {
  @IsNotEmpty({ message: 'El ID del curso no puede estar vacío.' })
  @IsNumber({}, { message: 'El ID del curso debe ser un número.' })
  courseId: number;

  @IsNotEmpty({ message: 'El nivel del curso no puede estar vacío.' })
  @IsString()
  level: string;

  @IsOptional()
  @IsNumber({}, { message: 'La nota debe ser un número.' })
  @Min(1.0, { message: 'La nota mínima es 1.0.' })
  @Max(7.0, { message: 'La nota máxima es 7.0.' })
  grade?: number;
}

export class UpdateTutorSpecificProfileDto {
  @IsOptional()
  @IsString()
  bio?: string; // Propiedad 'bio' añadida

  @IsOptional()
  @IsUrl({}, { message: 'CV URL debe ser una URL válida.' })
  cv_url?: string;

  @IsOptional()
  @IsString()
  experience_details?: string;

  @IsOptional()
  @IsEmail(
    {},
    { message: 'El email de contacto para tutorías debe ser válido.' },
  )
  tutoring_contact_email?: string;

  @IsOptional()
  // Cambiado null a undefined. Si se desea un país por defecto (ej. Chile), usar 'CL'.
  @IsPhoneNumber(undefined, {
    message: 'El teléfono de contacto para tutorías debe ser un número válido.',
  })
  tutoring_phone?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityBlockDto)
  availability?: AvailabilityBlockDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TutorCourseDto)
  courses?: TutorCourseDto[];
}
