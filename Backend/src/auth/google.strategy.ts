import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions, VerifyCallback } from 'passport-google-oauth20';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: `${process.env.BACKEND_URL}/auth/google/redirect`,
      scope: ['email', 'profile'],
    } as StrategyOptions); // 👈 esta conversión arregla el error de tipo
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const email = profile.emails?.[0].value;

    if (!email.endsWith('@mail.udp.cl')) {
      return done(new UnauthorizedException('Correo no institucional'), false);
    }

    const user = {
      email,
      name: profile.displayName,
    };

    done(null, user);
  }
}
