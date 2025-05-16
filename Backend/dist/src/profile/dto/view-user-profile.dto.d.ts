import { Role, DayOfWeek } from '@prisma/client';
declare class UserBaseDto {
    id: number;
    full_name: string;
    email: string;
    role: Role;
    photo_url: string | null;
    email_verified: boolean;
}
declare class StudentProfileViewDto {
    university: string;
    career: string;
    study_year: number;
    bio: string | null;
    interests: CourseInterestViewDto[];
}
declare class CourseInterestViewDto {
    courseId: number;
    courseName: string;
}
declare class TutorCourseViewDto {
    courseId: number;
    courseName: string;
    level: string;
    grade: number | null;
}
declare class AvailabilityBlockViewDto {
    day_of_week: DayOfWeek;
    start_time: string;
    end_time: string;
}
declare class TutorProfileViewDto {
    bio: string;
    average_rating: number;
    cv_url: string | null;
    experience_details: string | null;
    tutoring_contact_email: string | null;
    tutoring_phone: string | null;
    courses: TutorCourseViewDto[];
    availability: AvailabilityBlockViewDto[];
}
export declare class ViewUserProfileDto {
    user: UserBaseDto;
    studentProfile?: StudentProfileViewDto;
    tutorProfile?: TutorProfileViewDto;
}
export {};
