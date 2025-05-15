import { UsersService } from './users.service';
import { CreateStudentProfileDto } from './dto/create-student-profile.dto';
import { CreateTutorProfileDto } from './dto/create-tutor-profile.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    createStudent(dto: CreateStudentProfileDto, req: any): Promise<{
        id: number;
        userId: number;
        bio: string | null;
        university: string;
        career: string;
        study_year: number;
    }>;
    createTutor(dto: CreateTutorProfileDto, req: any): Promise<{
        id: number;
        userId: number;
        bio: string;
        average_rating: number;
    }>;
}
