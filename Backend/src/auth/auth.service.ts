import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, Role } from './dto/register.dto'; // Importado Role
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
    if (dto.role === Role.STUDENT || dto.role === Role.BOTH) {
      // Usando Role.STUDENT y Role.BOTH
      await this.prisma.studentProfile.create({
        data: {
          userId: user.id,
          university: '', // Valor por defecto
          career: '', // Valor por defecto
          study_year: 0, // Valor por defecto
          // bio puede ser opcional o llenado después
        },
      });
    }

    if (dto.role === Role.TUTOR || dto.role === Role.BOTH) {
      // Usando Role.TUTOR y Role.BOTH
      await this.prisma.tutorProfile.create({
        data: {
          userId: user.id,
          bio: '', // Bio inicial vacía o un placeholder
          // cv_url, experience_details, etc., son opcionales y se pueden llenar después
        },
      });
    }

    // No retornamos el password por seguridad
    const { password, ...safeUser } = user;

    // Generar token también en el registro
    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role, // Se usa el user.role del objeto User recién creado/leído
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

    // En el login, también devolvemos el usuario junto con el token para consistencia
    // y para que el frontend pueda tener acceso inmediato a los datos del usuario si es necesario.
    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: loginPassword, ...safeLoggedInUser } = user; // Renombrar para evitar conflicto de scope si es necesario
    return { user: safeLoggedInUser, access_token: token };
  }
}
