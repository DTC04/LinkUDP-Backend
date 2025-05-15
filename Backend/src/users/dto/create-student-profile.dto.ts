import { IsString, IsInt, IsOptional, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateStudentProfileDto {
  @IsString()
  university: string;

  @IsString()
  career: string;

  @IsInt()
  study_year: number;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsArray()
  @ArrayNotEmpty()
  interests: number[]; // array de IDs de cursos
}
