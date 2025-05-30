import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
export declare class AvailabilityController {
    private readonly availabilityService;
    constructor(availabilityService: AvailabilityService);
    getAvailability(tutorId: number): Promise<{
        id: number;
        tutorId: number;
        start_time: Date;
        end_time: Date;
        day_of_week: import(".prisma/client").$Enums.DayOfWeek;
    }[]>;
    createBlock(dto: CreateAvailabilityDto): Promise<{
        id: number;
        tutorId: number;
        start_time: Date;
        end_time: Date;
        day_of_week: import(".prisma/client").$Enums.DayOfWeek;
    }>;
    updateBlock(id: number, dto: UpdateAvailabilityDto): Promise<{
        id: number;
        tutorId: number;
        start_time: Date;
        end_time: Date;
        day_of_week: import(".prisma/client").$Enums.DayOfWeek;
    }>;
    deleteBlock(id: number): Promise<{
        id: number;
        tutorId: number;
        start_time: Date;
        end_time: Date;
        day_of_week: import(".prisma/client").$Enums.DayOfWeek;
    }>;
}
