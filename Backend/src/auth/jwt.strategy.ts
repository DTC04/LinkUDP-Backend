import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Try to get token from Authorization header
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // 2. Fallback to cookie
        (req) => {
          try {
            const raw = req?.cookies?.['access_token'];
            if (!raw) {
              // this.logger.debug('No access_token cookie found');
              return null;
            }
            this.logger.debug(`Found access_token cookie: ${raw}`);

            // Si es una cookie serializada tipo j:{...}
            if (typeof raw === 'string' && raw.startsWith('j:')) {
              const decoded = decodeURIComponent(raw.slice(2));
              const parsed = JSON.parse(decoded);
              this.logger.debug(`Parsed serialized cookie to: ${parsed.access_token}`);
              return parsed.access_token;
            }

            // Si ya es el JWT plano
            return raw;
          } catch (e) {
            this.logger.warn('Error parsing access_token cookie:', e);
            return null;
          }
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'supersecret', // Ensure this matches your signing secret
    });

    this.logger.log(
      `JwtStrategy initialized. Using secret: ${
        configService.get<string>('JWT_SECRET') ? 'from ConfigService (****)' : "'supersecret'"
      }. ignoreExpiration: false`,
    );
  }

  async validate(payload: JwtPayload) {
    this.logger.log(`Validating JWT payload: ${JSON.stringify(payload)}`);

    if (!payload || typeof payload.sub !== 'number') {
      this.logger.warn('JWT payload is invalid or missing "sub" (user ID).');
      throw new UnauthorizedException('Invalid token payload.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      this.logger.warn(
        `User with ID ${payload.sub} (from JWT sub) not found in database.`,
      );
      throw new UnauthorizedException(
        'User specified in token does not exist.',
      );
    }

    if (user.role !== payload.role) {
      this.logger.warn(
        `Role mismatch for user ${user.email} (ID: ${user.id}). JWT role: ${payload.role}, DB role: ${user.role}.`,
      );
    }

    this.logger.log(
      `User ${user.email} (ID: ${user.id}, Role: ${user.role}) validated successfully.`,
    );

    const { password, ...result } = user;
    return result;
  }
}
