import { IsEmail, IsString, IsEnum, MinLength } from 'class-validator';

enum Role {
  STUDENT = 'STUDENT',
  BOTH = 'BOTH',
  TUTOR = 'TUTOR',
}

export class RegisterDto {
  @IsString()
  full_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  role: 'STUDENT' | 'TUTOR' | 'BOTH';
}
