import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
export declare class FeedbackService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateFeedbackDto, userId: number): Promise<{
        id: number;
        sessionId: number;
        authorId: number;
        rating: number;
        comment: string | null;
        is_public: boolean;
        created_at: Date;
    }>;
    getPublicRatings(tutorId: number): Promise<{
        tutorId: number;
        averageRating: number;
        totalRatings: number;
    }>;
    getPrivateCommentsForTutor(tutorId: number, userId: number): Promise<{
        tutorId: number;
        totalComments: number;
        comments: {
            rating: number;
            comment: string | null;
            created_at: Date;
        }[];
    }>;
}
