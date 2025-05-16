// src/auth/jwt-auth.guard.ts
import {
  Injectable,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'; // Logger
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name); // Logger instance

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    this.logger.log('JwtAuthGuard canActivate called'); // Log guard activation
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    this.logger.log(`Authorization header: ${authHeader}`); // Log el header

    // Puedes añadir más lógica aquí si es necesario, pero primero veamos si el token llega
    const can = super.canActivate(context);
    this.logger.log(`super.canActivate result: ${JSON.stringify(can)}`); // Loguear el resultado de la validación
    return can;
  }

  handleRequest(err, user, info) {
    // Este método se llama después de que la estrategia ha hecho su trabajo.
    // Aquí puedes loguear el error o la información del token.
    this.logger.log(
      `handleRequest - User: ${JSON.stringify(user)}, Error: ${err}, Info: ${info}`,
    );
    if (err || !user) {
      this.logger.error(
        `Authentication error in handleRequest: ${err || info?.message}`,
      );
      throw err || new UnauthorizedException(info?.message || 'Unauthorized');
    }
    return user;
  }
}
