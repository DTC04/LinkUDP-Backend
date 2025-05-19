import { PrismaService } from '../prisma/prisma.service';
import { User, TutorProfile } from '@prisma/client';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UpdateTutorSpecificProfileDto } from './dto/update-tutor-specific-profile.dto';
import { ViewUserProfileDto } from './dto/view-user-profile.dto';
export declare class ProfileService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getMyProfile(userId: number): Promise<ViewUserProfileDto>;
    updateUserProfile(userId: number, dto: UpdateUserProfileDto): Promise<User>;
    updateTutorSpecificProfile(userId: number, dto: UpdateTutorSpecificProfileDto): Promise<TutorProfile>;
}
