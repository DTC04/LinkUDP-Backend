// Backend/src/profile/dto/view-user-profile.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, DayOfWeek } from '@prisma/client'; // Asegúrate que DayOfWeek esté importado

class UserBaseDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  full_name: string;
  @ApiProperty()
  email: string;
  @ApiProperty({ enum: Role })
  role: Role;
  @ApiPropertyOptional({ type: String, nullable: true }) // Corrección para Swagger con null
  photo_url: string | null;
  @ApiProperty()
  email_verified: boolean;
}

class CourseInterestViewDto {
  @ApiProperty()
  courseId: number;
  @ApiProperty()
  courseName: string;
}

class StudentProfileViewDto {
  @ApiPropertyOptional() id?: number; // Si decides exponer el ID del StudentProfile
  @ApiProperty()
  university: string;
  @ApiProperty()
  career: string;
  @ApiProperty()
  study_year: number;
  @ApiPropertyOptional({ type: String, nullable: true })
  bio: string | null;
  @ApiProperty({ type: () => [CourseInterestViewDto] })
  interests: CourseInterestViewDto[];
}

class TutorCourseViewDto {
  // @ApiPropertyOptional() id?: number; // ID de la relación TutorCourse
  @ApiProperty()
  courseId: number;
  @ApiProperty()
  courseName: string;
  @ApiProperty()
  level: string;
  @ApiPropertyOptional({ type: Number, nullable: true })
  grade: number | null;
}

class AvailabilityBlockViewDto {
  // @ApiPropertyOptional() id?: number; // ID del AvailabilityBlock
  @ApiProperty({ enum: DayOfWeek })
  day_of_week: DayOfWeek;
  @ApiProperty({ example: '09:00', type: String }) // Ejemplo de formato
  start_time: string;
  @ApiProperty({ example: '11:00', type: String }) // Ejemplo de formato
  end_time: string;
}

// --- ASEGÚRATE QUE ESTA CLASE ESTÉ ASÍ ---
class TutorProfileViewDto {
  @ApiProperty()
  id: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  bio: string | null;

  @ApiProperty()
  average_rating: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  cv_url: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  experience_details: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  tutoring_contact_email: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  tutoring_phone: string | null;

  // --- NUEVOS CAMPOS DEFINIDOS AQUÍ ---
  @ApiPropertyOptional({
    description: 'Universidad del tutor',
    type: String,
    nullable: true,
  })
  university?: string | null;

  @ApiPropertyOptional({
    description: 'Carrera/Título del tutor',
    type: String,
    nullable: true,
  })
  degree?: string | null;

  @ApiPropertyOptional({
    description: 'Año de estudio o situación académica del tutor',
    type: String,
    nullable: true,
  })
  academic_year?: string | null;
  // ------------------------------------

  @ApiProperty({ type: () => [TutorCourseViewDto] })
  courses: TutorCourseViewDto[];

  @ApiProperty({ type: () => [AvailabilityBlockViewDto] })
  availability: AvailabilityBlockViewDto[];
}
// -----------------------------------------

export class ViewUserProfileDto {
  @ApiProperty({ type: UserBaseDto })
  user: UserBaseDto;

  @ApiPropertyOptional({ type: StudentProfileViewDto })
  studentProfile?: StudentProfileViewDto;

  @ApiPropertyOptional({ type: TutorProfileViewDto })
  tutorProfile?: TutorProfileViewDto;
}
