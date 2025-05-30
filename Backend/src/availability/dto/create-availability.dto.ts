import { IsEnum, IsISO8601, IsInt } from 'class-validator'
import { DayOfWeek } from '@prisma/client'

export class CreateAvailabilityDto {
  @IsInt()
  tutorId: number

  @IsEnum(DayOfWeek)
  day_of_week: DayOfWeek

  @IsISO8601()
  start_time: string

  @IsISO8601()
  end_time: string
}
