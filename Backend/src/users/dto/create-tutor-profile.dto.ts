import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

import { IsEnum, IsISO8601 } from 'class-validator';
import { DayOfWeek } from '@prisma/client';

export class AvailabilityDto {
  @IsEnum(DayOfWeek, { message: 'El día debe ser uno de los valores válidos de DayOfWeek' })
  day_of_week: DayOfWeek;

  @IsISO8601({}, { message: 'La hora de inicio debe estar en formato ISO8601' })
  start_time: string;

  @IsISO8601({}, { message: 'La hora de término debe estar en formato ISO8601' })
  end_time: string;
}


export class CreateTutorProfileDto {
  @IsString()
  bio: string;

  @IsOptional()
  @IsString()
  contact_info?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityDto)
  availabilities: AvailabilityDto[];
}
