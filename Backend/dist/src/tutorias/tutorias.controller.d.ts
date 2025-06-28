import { TutoriasService } from './tutorias.service';
import { CreateTutoriaDto } from './dto/create-tutoria.dto';
import { UpdateTutoriaDto } from './dto/update-tutoria.dto';
import { TutoringSession } from '@prisma/client';
export declare class TutoriasController {
    private readonly tutoriasService;
    constructor(tutoriasService: TutoriasService);
    create(createTutoriaDto: CreateTutoriaDto): Promise<TutoringSession>;
    findAll(ramo?: string, horario?: string, tutorId?: number, status?: string | string[], upcoming?: string, limit?: number): Promise<TutoringSession[]>;
    getRecommended(user: {
        id: number;
    }): Promise<{
        id: number;
        created_at: Date;
        updated_at: Date;
        tutorId: number;
        courseId: number;
        title: string;
        description: string;
        date: Date;
        start_time: Date;
        end_time: Date;
        status: import(".prisma/client").$Enums.BookingStatus;
        location: string | null;
        notes: string | null;
    }[]>;
    findOne(id: number): Promise<TutoringSession>;
    update(id: number, updateTutoriaDto: UpdateTutoriaDto): Promise<TutoringSession>;
    remove(id: number): Promise<TutoringSession>;
    contactTutor(sessionId: number, message: string, req: any): Promise<{
        success: boolean;
    }>;
    save(id: number, user: {
        id: number;
    }): Promise<{
        id: number;
        userId: number;
        sessionId: number;
        createdAt: Date;
    }>;
    unsave(id: number, user: {
        id: number;
    }): Promise<{
        id: number;
        userId: number;
        sessionId: number;
        createdAt: Date;
    }>;
    getSaved(user: {
        id: number;
    }): Promise<({
        session: {
            course: {
                name: string;
                id: number;
                subject_area: string;
            };
            tutor: {
                user: {
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
                };
            } & {
                id: number;
                userId: number;
                bio: string;
                average_rating: number;
                cv_url: string | null;
                experience_details: string | null;
                tutoring_contact_email: string | null;
                tutoring_phone: string | null;
                university: string | null;
                degree: string | null;
                academic_year: string | null;
            };
        } & {
            id: number;
            created_at: Date;
            updated_at: Date;
            tutorId: number;
            courseId: number;
            title: string;
            description: string;
            date: Date;
            start_time: Date;
            end_time: Date;
            status: import(".prisma/client").$Enums.BookingStatus;
            location: string | null;
            notes: string | null;
        };
    } & {
        id: number;
        userId: number;
        sessionId: number;
        createdAt: Date;
    })[]>;
}
