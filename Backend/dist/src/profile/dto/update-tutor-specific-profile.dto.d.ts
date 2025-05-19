import { AvailabilityBlockDto } from './availability-block.dto';
import { TutorCourseDto } from './tutor-course.dto';
export declare class UpdateTutorSpecificProfileDto {
    bio?: string;
    cv_url?: string;
    experience_details?: string;
    tutoring_contact_email?: string;
    tutoring_phone?: string;
    university?: string;
    degree?: string;
    academic_year?: string;
    availability?: AvailabilityBlockDto[];
    courses?: TutorCourseDto[];
}
