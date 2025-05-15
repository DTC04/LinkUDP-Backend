import { DayOfWeek } from '@prisma/client';
declare class AvailabilityBlockDto {
    day_of_week: DayOfWeek;
    start_time: string;
    end_time: string;
}
export declare class UpdateTutorProfileDto {
    bio?: string;
    contact?: string;
    availability?: AvailabilityBlockDto[];
}
export {};
