import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
interface JwtPayload {
    sub: number;
    email: string;
    role: Role;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService);
    validate(payload: JwtPayload): Promise<{
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
}
export {};
