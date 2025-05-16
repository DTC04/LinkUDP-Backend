// src/profile/profile.module.ts
import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
// Si tu AuthModule provee JwtAuthGuard y la estrategia JWT, impórtalo
// import { AuthModule } from '../auth/auth.module';

@Module({
  // imports: [AuthModule], // Descomenta si AuthModule es necesario para guardias/estrategias
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
