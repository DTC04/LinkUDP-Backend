import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
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
      throw new Error('Ya existe un usuario con ese correo');
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

    // Crear perfiles basados en el rol
    if (dto.role === 'STUDENT' || dto.role === 'BOTH') {
      await this.prisma.studentProfile.create({
        data: {
          userId: user.id,
          university: '',
          career: '',
          study_year: 0,
        },
      });
    }

    if (dto.role === 'TUTOR' || dto.role === 'BOTH') {
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
      return null;
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);

    if (!isMatch) {
      return null;
    }

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { access_token: token };
  }
}
