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
  private readonly logger = new Logger(JwtStrategy.name); // Instancia del Logger

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService, // Inyectar ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Es importante que sea false para rechazar tokens expirados
      secretOrKey: configService.get<string>('JWT_SECRET') || 'supersecret', // Usar ConfigService
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

    // Validar si el rol en el payload coincide con el rol en la BD (opcional, pero buena práctica)
    if (user.role !== payload.role) {
      this.logger.warn(
        `Role mismatch for user ${user.email} (ID: ${user.id}). JWT role: ${payload.role}, DB role: ${user.role}.`,
      );
      // Dependiendo de tu política de seguridad, podrías invalidar el token aquí
      // throw new UnauthorizedException('User role changed, please re-authenticate.');
    }

    this.logger.log(
      `User ${user.email} (ID: ${user.id}, Role: ${user.role}) validated successfully.`,
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user; // Quitar la contraseña del objeto usuario que se adjuntará a la request
    return result; // Este 'result' será adjuntado a `request.user`
  }
}
