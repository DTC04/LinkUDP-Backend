import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, Role } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private readonly mailerService: MailerService,
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
        email_verified: false,
      },
    });

    // Create default notification preferences for the new user
    await this.prisma.notificationPreference.create({
      data: {
        userId: user.id,
        // Default values from schema.prisma will be applied automatically
        // e.g., email_on_booking: true, email_on_cancellation: true, etc.
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

   
    const verificationToken = this.jwt.sign(
      { userId: user.id },
      { expiresIn: '1d', secret: process.env.JWT_SECRET },
    );

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Verifica tu correo electrónico',
      text: `Hola ${user.full_name}, por favor verifica tu correo haciendo clic en el siguiente enlace:\n${process.env.FRONTEND_URL}/verify?token=${verificationToken}`,
    });    

    const { password, ...safeUser } = user;

    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { user: safeUser, access_token: token, 
      message: 'Te hemos enviado un correo para verificar tu cuenta.', };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      await this.logAttempt(null, false);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.email_verified) {
      throw new UnauthorizedException('Debes verificar tu correo electrónico antes de iniciar sesión.');
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

  async loginWithGoogle(googleUser: any): Promise<{ token: string; isNewUser: boolean; user: any }> {
    const { email, name } = googleUser;
  
    let user = await this.prisma.user.findUnique({ where: { email } });
    const isNewUser = !user;
  
    if (isNewUser) {
      user = await this.prisma.user.create({
        data: {
          email,
          full_name: name,
          role: 'STUDENT',
          email_verified: true,
        },
      });

      // Create default notification preferences for the new Google user
      await this.prisma.notificationPreference.create({
        data: {
          userId: user.id,
          // Default values from schema.prisma will be applied
        },
      });

      // Optionally, create a default StudentProfile for new Google users
      // This depends on your application's logic for onboarding Google users
      await this.prisma.studentProfile.create({
        data: {
          userId: user.id,
          university: '', // Or some default/placeholder
          career: '',     // Or some default/placeholder
          study_year: 0,  // Or some default/placeholder
        },
      });
    }
  
    if (!user) {
      throw new Error('No se pudo crear o recuperar el usuario de Google');
    }
  
    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  
    return { token, isNewUser, user };
  }
  
  
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Por seguridad, no informamos si el usuario no existe
    if (!user) return;

    const token = this.jwt.sign(
      { email },
      { expiresIn: '15m', secret: process.env.JWT_FORGOT_PASSWORD } // Expira en 15 minutos
    );
//modificar una vez este levantado el servicio
    const resetUrl = `http://localhost:3001/reset-password?token=${token}`;

   await this.mailerService.sendMail({
  to: email,
  subject: 'Restablece tu contraseña',
  html: `
    <h2>Recuperación de contraseña</h2>
    <p>Haz clic en el botón para restablecer tu contraseña:</p>
    <a href="${resetUrl}" style="
      display: inline-block;
      padding: 10px 20px;
      background-color: #0ea5e9;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
    ">
      Restablecer contraseña
    </a>
    <p style="font-size: 12px; color: #666; margin-top: 20px;">
      Si no solicitaste este cambio, puedes ignorar este mensaje.<br/>
      Este enlace expirará en 15 minutos.
    </p>
  `,
});
  }

async resetPassword(token: string, newPassword: string) {
  let payload: any;

  try {
    payload = this.jwt.verify(token, {
      secret: process.env.JWT_FORGOT_PASSWORD,
    });
  } catch (err) {
    throw new Error('El token es inválido o ha expirado.');
  }

  const user = await this.prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new Error('Usuario no encontrado.');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await this.prisma.user.update({
    where: { email: payload.email },
    data: { password: hashedPassword },
  });

  return { message: 'Contraseña actualizada con éxito.' };
}




  
  async assignRole(userId: number, role: Role.STUDENT | Role.TUTOR) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    if (role === Role.STUDENT) {
      await this.prisma.studentProfile.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          university: '',
          career: '',
          study_year: 0,
        },
      });
    }

    if (role === Role.TUTOR) {
      await this.prisma.tutorProfile.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          bio: '',
        },
      });
    }
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
    return lastFive.length === 5 && lastFive.every((a) => !a.success);
  }

  async verifyEmailToken(token: string): Promise<any> {
    // Lógica para verificar el token de verificación de correo electrónico
    // Por ejemplo, usando JWT:
    try {
      const payload = this.jwt.verify(token, { secret: process.env.JWT_SECRET });
      // Aquí podrías actualizar el usuario como verificado si lo deseas
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado.');
    }
  }

  async resendVerificationEmail(email: string): Promise<void> {
    // Lógica para reenviar el correo de verificación
    // Ejemplo: buscar usuario, generar token, enviar email, etc.
    throw new Error('No implementado');
  }
}
