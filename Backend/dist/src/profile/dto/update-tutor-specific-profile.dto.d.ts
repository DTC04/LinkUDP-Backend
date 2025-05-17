import { DayOfWeek } from '@prisma/client';
export declare class AvailabilityBlockDto {
    day_of_week: DayOfWeek;
    start_time: string;
    end_time: string;
}
export declare class TutorCourseDto {
    courseId: number;
    level: string;
    grade?: number;
}
export declare class UpdateTutorSpecificProfileDto {
    bio?: string;
    cv_url?: string;
    experience_details?: string;
    tutoring_contact_email?: string;
    tutoring_phone?: string;
    availability?: AvailabilityBlockDto[];
    courses?: TutorCourseDto[];
}
