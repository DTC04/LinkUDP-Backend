import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule, // Asegurarse que ConfigModule esté disponible
    JwtModule.registerAsync({
      imports: [ConfigModule], // Importar ConfigModule aquí también
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'supersecret', // Usar ConfigService
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService], // Inyectar ConfigService
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtStrategy],
})
export class AuthModule {}
