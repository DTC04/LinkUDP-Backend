import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, Role } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, res: Response): Promise<{
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
    login(dto: LoginDto, res: Response): Promise<{
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
    logout(res: Response): Promise<{
        message: string;
    }>;
    googleAuth(): Promise<void>;
    googleRedirect(req: Request & {
        user?: any;
    }, res: Response): Promise<void>;
    assignRole(body: {
        role: Role;
        userId: number;
    }, res: Response): Promise<{
        message: string;
        redirectTo: string;
    }>;
    getMe(user: any): any;
}
