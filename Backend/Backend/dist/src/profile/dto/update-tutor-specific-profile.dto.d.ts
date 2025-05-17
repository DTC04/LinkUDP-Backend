import { AvailabilityBlockDto } from './availability-block.dto';
import { TutorCourseDto } from './tutor-course.dto';
export declare class UpdateTutorSpecificProfileDto {
    cv_url?: string;
    experience_details?: string;
    tutoring_contact_email?: string;
    tutoring_phone?: string;
    availability?: AvailabilityBlockDto[];
    courses?: TutorCourseDto[];
}
export { AvailabilityBlockDto, TutorCourseDto };
