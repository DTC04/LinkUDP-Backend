import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
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
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
    }>;
}
