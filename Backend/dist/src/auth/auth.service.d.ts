import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, Role } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
export declare class AuthService {
    private prisma;
    private jwt;
    private readonly mailerService;
    constructor(prisma: PrismaService, jwt: JwtService, mailerService: MailerService);
    register(dto: RegisterDto): Promise<{
        user: {
            id: number;
            full_name: string;
            email: string;
            oauth_provider: string | null;
            oauth_provider_id: string | null;
            role: import(".prisma/client").$Enums.Role;
            photo_url: string | null;
            email_verified: boolean;
            created_at: Date;
            updated_at: Date;
        };
        access_token: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: number;
            full_name: string;
            email: string;
            oauth_provider: string | null;
            oauth_provider_id: string | null;
            role: import(".prisma/client").$Enums.Role;
            photo_url: string | null;
            email_verified: boolean;
            created_at: Date;
            updated_at: Date;
        };
        access_token: string;
    }>;
    loginWithGoogle(googleUser: any): Promise<{
        token: string;
        isNewUser: boolean;
        user: any;
    }>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    assignRole(userId: number, role: Role.STUDENT | Role.TUTOR): Promise<void>;
    private logAttempt;
    private isUserTemporarilyBlocked;
}
