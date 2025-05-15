import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStudentProfileDto } from './dto/create-student-profile.dto';
import { CreateTutorProfileDto } from './dto/create-tutor-profile.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { UpdateTutorProfileDto } from './dto/update-tutor-profile.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getProfile(userId: number): Promise<{
        tutorProfile: ({
            availabilities: {
                id: number;
                tutorId: number;
                start_time: Date;
                end_time: Date;
                day_of_week: import(".prisma/client").$Enums.DayOfWeek;
            }[];
        } & {
            id: number;
            userId: number;
            bio: string;
            average_rating: number;
        }) | null;
        studentProfile: ({
            interests: ({
                course: {
                    name: string;
                    id: number;
                    subject_area: string;
                };
            } & {
                id: number;
                courseId: number;
                studentProfileId: number;
            })[];
        } & {
            id: number;
            userId: number;
            bio: string | null;
            university: string;
            career: string;
            study_year: number;
        }) | null;
    } & {
        id: number;
        full_name: string;
        email: string;
        password: string | null;
        oauth_provider: string | null;
        oauth_provider_id: string | null;
        role: import(".prisma/client").$Enums.Role;
        photo_url: string | null;
        email_verified: boolean;
        created_at: Date;
        updated_at: Date;
    }>;
    createStudentProfile(userId: number, data: CreateStudentProfileDto): Promise<{
        id: number;
        userId: number;
        bio: string | null;
        university: string;
        career: string;
        study_year: number;
    }>;
    createTutorProfile(userId: number, data: CreateTutorProfileDto): Promise<{
        id: number;
        userId: number;
        bio: string;
        average_rating: number;
    }>;
    updateStudentProfile(userId: number, data: UpdateStudentProfileDto): Promise<{
        id: number;
        userId: number;
        bio: string | null;
        university: string;
        career: string;
        study_year: number;
    }>;
    updateTutorProfile(userId: number, data: UpdateTutorProfileDto): Promise<{
        id: number;
        userId: number;
        bio: string;
        average_rating: number;
    }>;
}
