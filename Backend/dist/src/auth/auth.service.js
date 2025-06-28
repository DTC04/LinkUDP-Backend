"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const register_dto_1 = require("./dto/register.dto");
const bcrypt = require("bcrypt");
const jwt_1 = require("@nestjs/jwt");
const mailer_1 = require("@nestjs-modules/mailer");
let AuthService = class AuthService {
    prisma;
    jwt;
    mailerService;
    constructor(prisma, jwt, mailerService) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.mailerService = mailerService;
    }
    async register(dto) {
        const userExists = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (userExists) {
            throw new common_1.HttpException('El correo electrónico ya está registrado.', common_1.HttpStatus.CONFLICT);
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
        await this.prisma.notificationPreference.create({
            data: {
                userId: user.id,
            },
        });
        if (dto.role === register_dto_1.Role.STUDENT || dto.role === register_dto_1.Role.BOTH) {
            await this.prisma.studentProfile.create({
                data: {
                    userId: user.id,
                    university: '',
                    career: '',
                    study_year: 0,
                },
            });
        }
        if (dto.role === register_dto_1.Role.TUTOR || dto.role === register_dto_1.Role.BOTH) {
            await this.prisma.tutorProfile.create({
                data: {
                    userId: user.id,
                    bio: '',
                },
            });
        }
        const verificationToken = this.jwt.sign({ userId: user.id }, { expiresIn: '1d', secret: process.env.JWT_SECRET });
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
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user || !user.password) {
            await this.logAttempt(null, false);
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        if (!user.email_verified) {
            throw new common_1.UnauthorizedException('Debes verificar tu correo electrónico antes de iniciar sesión.');
        }
        const isBlocked = await this.isUserTemporarilyBlocked(user.id);
        if (isBlocked) {
            throw new common_1.UnauthorizedException('Demasiados intentos fallidos. Inténtalo más tarde.');
        }
        const isMatch = await bcrypt.compare(dto.password, user.password);
        await this.logAttempt(user.id, isMatch);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        const token = this.jwt.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        const { password: _, ...safeUser } = user;
        return { user: safeUser, access_token: token };
    }
    async loginWithGoogle(googleUser) {
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
            await this.prisma.notificationPreference.create({
                data: {
                    userId: user.id,
                },
            });
            await this.prisma.studentProfile.create({
                data: {
                    userId: user.id,
                    university: '',
                    career: '',
                    study_year: 0,
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
<<<<<<< HEAD
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            return;
        const token = this.jwt.sign({ email }, { expiresIn: '15m', secret: process.env.JWT_FORGOT_PASSWORD });
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
    async resetPassword(token, newPassword) {
        let payload;
        try {
            payload = this.jwt.verify(token, {
                secret: process.env.JWT_FORGOT_PASSWORD,
            });
        }
        catch (err) {
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
=======
    async verifyEmailToken(token) {
        try {
            const payload = this.jwt.verify(token, { secret: process.env.JWT_SECRET });
            await this.prisma.user.update({
                where: { id: payload.userId },
                data: { email_verified: true },
            });
            return payload;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Token inválido o expirado.');
        }
    }
    async resendVerificationEmail(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return;
        }
        if (user.email_verified) {
            return;
        }
        const verificationToken = this.jwt.sign({ userId: user.id }, { expiresIn: '1d', secret: process.env.JWT_SECRET });
        await this.mailerService.sendMail({
            to: user.email,
            subject: 'Verifica tu correo electrónico',
            text: `Hola ${user.full_name}, por favor verifica tu correo haciendo clic en el siguiente enlace:\n${process.env.FRONTEND_URL}/verify?token=${verificationToken}`,
        });
>>>>>>> 913936c99bd0943bc281d1d0c0047e5434fa602f
    }
    async assignRole(userId, role) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { role },
        });
        if (role === register_dto_1.Role.STUDENT) {
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
        if (role === register_dto_1.Role.TUTOR) {
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
    async logAttempt(userId, success) {
        if (userId) {
            await this.prisma.loginAttempt.create({
                data: {
                    userId,
                    success,
                },
            });
        }
    }
    async isUserTemporarilyBlocked(userId) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        mailer_1.MailerService])
], AuthService);
//# sourceMappingURL=auth.service.js.map