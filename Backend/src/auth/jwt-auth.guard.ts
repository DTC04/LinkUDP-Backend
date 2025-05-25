// src/auth/jwt-auth.guard.ts
import {
  Injectable,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    this.logger.log('JwtAuthGuard canActivate called');

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.log('Public route detected, bypassing JWT validation.');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    this.logger.log(`Authorization header: ${authHeader}`);

    const can = super.canActivate(context);
    // super.canActivate(context) can return a Promise or Observable,
    // so we need to handle that if we want to log its resolved value.
    // For simplicity here, we'll just return it.
    // If you need to log the result, you'd do something like:
    // return (async () => {
    //   const result = await super.canActivate(context);
    //   this.logger.log(`super.canActivate result: ${JSON.stringify(result)}`);
    //   return result;
    // })();
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
