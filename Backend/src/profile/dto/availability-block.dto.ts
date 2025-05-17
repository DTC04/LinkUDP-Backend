import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

export class AvailabilityBlockDto {
  @ApiPropertyOptional({
    description: 'ID del bloque de disponibilidad (solo para actualizaciones)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({
    enum: DayOfWeek,
    description: 'Día de la semana para la disponibilidad',
    example: DayOfWeek.LUNES,
  })
  @IsNotEmpty()
  @IsEnum(DayOfWeek)
  day_of_week: DayOfWeek;

  @ApiProperty({
    description: 'Hora de inicio en formato HH:MM (24h)',
    example: '09:00',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'start_time debe estar en formato HH:MM',
  })
  start_time: string; // Se recibirá como string "HH:MM"

  @ApiProperty({
    description: 'Hora de fin en formato HH:MM (24h)',
    example: '11:00',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'end_time debe estar en formato HH:MM',
  })
  end_time: string; // Se recibirá como string "HH:MM"
}
