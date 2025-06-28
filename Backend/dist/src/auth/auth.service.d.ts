import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, Role } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
export declare class AuthService {
    private prisma;
    private jwt;
<<<<<<< HEAD
    private readonly mailerService;
=======
<<<<<<< HEAD
    private readonly mailerService;
=======
    private mailerService;
>>>>>>> 913936c99bd0943bc281d1d0c0047e5434fa602f
>>>>>>> 5fec84dab2290a5c7a7b45725507facdea7d0de6
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
        message: string;
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
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 5fec84dab2290a5c7a7b45725507facdea7d0de6
    forgotPassword(email: string): Promise<void>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
<<<<<<< HEAD
    verifyEmailToken(token: string): Promise<any>;
    resendVerificationEmail(email: string): Promise<void>;
=======
=======
    verifyEmailToken(token: string): Promise<any>;
    resendVerificationEmail(email: string): Promise<void>;
>>>>>>> 913936c99bd0943bc281d1d0c0047e5434fa602f
>>>>>>> 5fec84dab2290a5c7a7b45725507facdea7d0de6
    assignRole(userId: number, role: Role.STUDENT | Role.TUTOR): Promise<void>;
    private logAttempt;
    private isUserTemporarilyBlocked;
}
