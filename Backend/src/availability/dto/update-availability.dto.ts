import { IsOptional, IsEnum, IsISO8601 } from 'class-validator'
import { DayOfWeek } from '@prisma/client'

export class UpdateAvailabilityDto {
  @IsOptional()
  @IsEnum(DayOfWeek)
  day_of_week?: DayOfWeek

  @IsOptional()
  @IsISO8601()
  start_time?: string

  @IsOptional()
  @IsISO8601()
  end_time?: string
}
