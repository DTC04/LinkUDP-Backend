import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateStudentProfileDto {
  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @IsString()
  career?: string;

  @IsOptional()
  @IsInt()
  study_year?: number;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  interests?: number[]; // IDs de los cursos
}
