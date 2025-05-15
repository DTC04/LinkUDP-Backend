import { DayOfWeek } from '@prisma/client';
export declare class AvailabilityDto {
    day_of_week: DayOfWeek;
    start_time: string;
    end_time: string;
}
export declare class CreateTutorProfileDto {
    bio: string;
    contact_info?: string;
    availabilities: AvailabilityDto[];
}
