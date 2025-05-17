import { AvailabilityService } from './availability.service';
export declare class AvailabilityController {
    private availabilityService;
    constructor(availabilityService: AvailabilityService);
    getAvailability(tutorId: number): Promise<{
        day_of_week: import(".prisma/client").$Enums.DayOfWeek;
        start_time: string;
        end_time: string;
    }[]>;
}
