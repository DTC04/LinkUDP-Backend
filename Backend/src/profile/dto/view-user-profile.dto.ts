import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, DayOfWeek } from '@prisma/client';

class UserBaseDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  full_name: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  role: Role;
  @ApiProperty({ nullable: true })
  photo_url: string | null;
  @ApiProperty()
  email_verified: boolean;
}

class StudentProfileViewDto {
  @ApiProperty()
  university: string;
  @ApiProperty()
  career: string;
  @ApiProperty()
  study_year: number;
  @ApiProperty({ nullable: true })
  bio: string | null;
  @ApiProperty({ type: () => [CourseInterestViewDto] })
  interests: CourseInterestViewDto[];
}

class CourseInterestViewDto {
  @ApiProperty()
  courseId: number;
  @ApiProperty()
  courseName: string;
}

class TutorCourseViewDto {
  @ApiProperty()
  courseId: number;
  @ApiProperty()
  courseName: string;
  @ApiProperty()
  level: string;
  @ApiProperty({ nullable: true })
  grade: number | null;
}

class AvailabilityBlockViewDto {
  @ApiProperty({ enum: DayOfWeek })
  day_of_week: DayOfWeek;
  @ApiProperty()
  start_time: string; // HH:MM
  @ApiProperty()
  end_time: string; // HH:MM
}

class TutorProfileViewDto {
  @ApiProperty()
  bio: string;
  @ApiProperty()
  average_rating: number;
  @ApiProperty({ nullable: true })
  cv_url: string | null;
  @ApiProperty({ nullable: true })
  experience_details: string | null;
  @ApiProperty({ nullable: true })
  tutoring_contact_email: string | null;
  @ApiProperty({ nullable: true })
  tutoring_phone: string | null;
  @ApiProperty({ type: () => [TutorCourseViewDto] })
  courses: TutorCourseViewDto[];
  @ApiProperty({ type: () => [AvailabilityBlockViewDto] })
  availability: AvailabilityBlockViewDto[];
}

export class ViewUserProfileDto {
  @ApiProperty({ type: UserBaseDto })
  user: UserBaseDto;

  @ApiPropertyOptional({ type: StudentProfileViewDto })
  studentProfile?: StudentProfileViewDto;

  @ApiPropertyOptional({ type: TutorProfileViewDto })
  tutorProfile?: TutorProfileViewDto;
}
