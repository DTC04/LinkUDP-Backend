import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from '@prisma/client';

class AvailabilityBlockDto {
  @IsString()
  day_of_week: DayOfWeek;

  @IsString()
  start_time: string;

  @IsString()
  end_time: string;
}

export class UpdateTutorProfileDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityBlockDto)
  availability?: AvailabilityBlockDto[];
}