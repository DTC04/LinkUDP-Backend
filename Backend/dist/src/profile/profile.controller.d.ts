import { ProfileService } from './profile.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UpdateTutorSpecificProfileDto } from './dto/update-tutor-specific-profile.dto';
import { ViewUserProfileDto } from './dto/view-user-profile.dto';
import { User as UserModel } from '@prisma/client';
export declare class ProfileController {
    private readonly profileService;
    constructor(profileService: ProfileService);
    getMyProfile(user: {
        id: number;
    }): Promise<ViewUserProfileDto>;
    updateUserProfile(user: {
        id: number;
    }, dto: UpdateUserProfileDto): Promise<ViewUserProfileDto>;
    updateTutorSpecificProfile(user: UserModel, dto: UpdateTutorSpecificProfileDto): Promise<ViewUserProfileDto>;
}
