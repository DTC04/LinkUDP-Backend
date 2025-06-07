import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { Request } from 'express';
export declare class FeedbackController {
    private readonly feedbackService;
    constructor(feedbackService: FeedbackService);
    create(dto: CreateFeedbackDto, req: Request): Promise<{
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
    getPrivateComments(tutorId: number, req: Request): Promise<{
        tutorId: number;
        totalComments: number;
        comments: {
            rating: number;
            comment: string | null;
            created_at: Date;
        }[];
    }>;
}
