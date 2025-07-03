import { PrismaService } from '../prisma/prisma.service';
import { CreateTutoriaDto } from './dto/create-tutoria.dto';
import { UpdateTutoriaDto } from './dto/update-tutoria.dto';
import { TutoringSession } from '@prisma/client';
import { MailerService } from '@nestjs-modules/mailer';
export declare class TutoriasService {
    private prisma;
    private readonly mailerService;
    private readonly logger;
    constructor(prisma: PrismaService, mailerService: MailerService);
    private validateText;
    create(createTutoriaDto: CreateTutoriaDto): Promise<TutoringSession>;
    findAll(ramo?: string, horario?: string, tutorId?: number, status?: string | string[], upcoming?: boolean, limit?: number): Promise<TutoringSession[]>;
    findOne(id: number): Promise<TutoringSession | null>;
    update(id: number, updateTutoriaDto: UpdateTutoriaDto): Promise<TutoringSession>;
    remove(id: number): Promise<TutoringSession>;
    getRecommendedTutorings(userId?: number): Promise<TutoringSession[]>;
    contactTutor(sessionId: number, studentUserId: number, message: string): Promise<void>;
    save(sessionId: number, userId: number): Promise<{
        id: number;
        userId: number;
        sessionId: number;
        createdAt: Date;
    }>;
    unsave(sessionId: number, userId: number): Promise<{
        id: number;
        userId: number;
        sessionId: number;
        createdAt: Date;
    }>;
    getSaved(userId: number): Promise<({
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
    getStudentsByTutoriaId(tutoriaId: string): Promise<{
        id: number;
        name: string;
        email: string;
        rating: number;
        averageRating: number;
        hasBeenRated: boolean;
    }[]>;
    rateStudent(sessionId: number, studentId: number, rating: number, tutorUserId: number): Promise<{
        success: boolean;
    }>;
}
