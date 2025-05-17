import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
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
    } | null>;
}
