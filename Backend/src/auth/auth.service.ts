import { Injectable, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, Role } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const userExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (userExists) {
      throw new HttpException('El correo electrónico ya está registrado.', HttpStatus.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        full_name: dto.full_name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
      },
    });

    if (dto.role === Role.STUDENT || dto.role === Role.BOTH) {
      await this.prisma.studentProfile.create({
        data: {
          userId: user.id,
          university: '',
          career: '',
          study_year: 0,
        },
      });
    }

    if (dto.role === Role.TUTOR || dto.role === Role.BOTH) {
      await this.prisma.tutorProfile.create({
        data: {
          userId: user.id,
          bio: '',
        },
      });
    }

    const { password, ...safeUser } = user;

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { user: safeUser, access_token: token };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      await this.logAttempt(null, false);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isBlocked = await this.isUserTemporarilyBlocked(user.id);
    if (isBlocked) {
      throw new UnauthorizedException('Demasiados intentos fallidos. Inténtalo más tarde.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    await this.logAttempt(user.id, isMatch);

    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const { password: _, ...safeUser } = user;
    return { user: safeUser, access_token: token };
  }

  private async logAttempt(userId: number | null, success: boolean) {
    if (userId) {
      await this.prisma.loginAttempt.create({
        data: {
          userId,
          success,
        },
      });
    }
  }

  private async isUserTemporarilyBlocked(userId: number): Promise<boolean> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const recentAttempts = await this.prisma.loginAttempt.findMany({
      where: {
        userId,
        attempted_at: {
          gte: fifteenMinutesAgo,
        },
      },
      orderBy: {
        attempted_at: 'desc',
      },
      take: 5,
    });

    const lastFive = recentAttempts.slice(0, 5);
    return lastFive.length === 5 && lastFive.every(a => !a.success);
  }
}
