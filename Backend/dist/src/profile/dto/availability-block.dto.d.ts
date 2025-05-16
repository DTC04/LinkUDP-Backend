import { DayOfWeek } from '@prisma/client';
export declare class AvailabilityBlockDto {
    id?: number;
    day_of_week: DayOfWeek;
    start_time: string;
    end_time: string;
}
