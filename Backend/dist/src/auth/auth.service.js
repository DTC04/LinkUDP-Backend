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
let AuthService = class AuthService {
    prisma;
    jwt;
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
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
        const { password, ...safeUser } = user;
        const token = this.jwt.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        return { user: safeUser, access_token: token };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user || !user.password) {
            await this.logAttempt(null, false);
            throw new common_1.UnauthorizedException('Credenciales inválidas');
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
        return lastFive.length === 5 && lastFive.every(a => !a.success);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map