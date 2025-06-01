// Backend/src/profile/dto/update-tutor-specific-profile.dto.ts
import {
  IsString,
  IsOptional,
  IsUrl,
  IsEmail,
  IsPhoneNumber, // Asegúrate de que esta validación es la que deseas, o usa IsString
  IsArray,
  ValidateNested,
  // Quita IsNotEmpty, IsEnum, IsNumber, Min, Max de aquí si se usan solo en sub-DTOs
} from 'class-validator';
import { Type } from 'class-transformer';
import { AvailabilityBlockDto } from './availability-block.dto'; // Asumiendo que este DTO está bien definido
import { TutorCourseDto } from './tutor-course.dto'; // Asumiendo que este DTO está bien definido

export class UpdateTutorSpecificProfileDto {
  @IsOptional()
  @IsString()
  bio?: string; // El 'bio' específico del TutorProfile, si se maneja aquí además del general en /profile/me

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
  @IsPhoneNumber(undefined, {
    // O usa @IsString() si la validación de IsPhoneNumber es muy estricta/específica
    message: 'El teléfono de contacto para tutorías debe ser un número válido.',
  })
  tutoring_phone?: string;

  // --- NUEVOS CAMPOS DTO ---
  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @IsString()
  degree?: string;

  @IsOptional()
  @IsString()
  academic_year?: string;
  // -------------------------

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

// Re-exportar si es necesario y si estos DTOs no están ya en archivos separados como lo estaban antes
// export { AvailabilityBlockDto, TutorCourseDto }; // Comentado porque ya los importas
