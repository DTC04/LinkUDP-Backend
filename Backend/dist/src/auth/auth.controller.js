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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const register_dto_1 = require("./dto/register.dto");
const login_dto_1 = require("./dto/login.dto");
const passport_1 = require("@nestjs/passport");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const get_user_decorator_1 = require("./get-user.decorator");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const public_decorator_1 = require("./public.decorator");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
};
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async register(dto, res) {
        const result = await this.authService.register(dto);
        if (result?.access_token && typeof result.access_token === 'string') {
            res.cookie('access_token', result.access_token, cookieOptions);
            return result;
        }
        throw new Error('Error durante el registro');
    }
    async login(dto, res) {
        const result = await this.authService.login(dto);
        if (!result || typeof result.access_token !== 'string') {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        res.cookie('access_token', result.access_token, cookieOptions);
        return result;
    }
    async logout(res) {
        res.clearCookie('access_token', cookieOptions);
        return { message: 'Logout exitoso' };
    }
    async forgotPassword(body) {
        try {
            await this.authService.forgotPassword(body.email);
        }
        catch (err) {
            throw new common_1.HttpException('Error al enviar el correo', 500);
        }
    }
    async resetPassword(body) {
        try {
            await this.authService.resetPassword(body.token, body.password);
        }
        catch (err) {
            throw new common_1.HttpException(err.message || 'Error al restablecer la contraseña', 400);
        }
    }
    async googleAuth() {
    }
    async googleRedirect(req, res) {
        if (!req.user) {
            throw new common_1.UnauthorizedException('Usuario de Google no disponible');
        }
        const { token, isNewUser, user } = await this.authService.loginWithGoogle(req.user);
        if (!token || typeof token !== 'string') {
            throw new Error('Fallo al generar el token de Google');
        }
        res.cookie('access_token', token, cookieOptions);
        let redirectTo = 'http://localhost:3001/dashboard';
        if (isNewUser) {
            redirectTo = 'http://localhost:3001/onboarding/select-role';
        }
        else if (user.role === register_dto_1.Role.STUDENT) {
            redirectTo = 'http://localhost:3001/dashboard/student';
        }
        else if (user.role === register_dto_1.Role.TUTOR) {
            redirectTo = 'http://localhost:3001/dashboard/tutor';
        }
        res.redirect(redirectTo);
    }
    async assignRole(body, res) {
        const { userId, role } = body;
        if (role !== register_dto_1.Role.STUDENT && role !== register_dto_1.Role.TUTOR) {
            throw new common_1.HttpException('Rol inválido. Solo se permite STUDENT o TUTOR.', common_1.HttpStatus.BAD_REQUEST);
        }
        await this.authService.assignRole(userId, role);
        const user = await this.authService['prisma'].user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Usuario no encontrado');
        }
        const token = this.authService['jwt'].sign({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        res.cookie('access_token', token, cookieOptions);
        const redirectTo = role === register_dto_1.Role.STUDENT
            ? 'http://localhost:3001/onboarding/student'
            : 'http://localhost:3001/onboarding/tutor';
        return { message: 'Rol asignado', redirectTo };
    }
    getMe(user) {
        const { password, ...safeUser } = user;
        return safeUser;
    }
    async verifyEmail(token) {
        try {
            const payload = await this.authService.verifyEmailToken(token);
            return { message: 'Correo verificado con éxito.' };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Token inválido o expirado.');
        }
    }
    async resendVerificationEmail(email) {
        await this.authService.resendVerificationEmail(email);
        return { message: 'Se ha reenviado un nuevo enlace de verificación.' };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Get)('google'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, common_1.Get)('google/redirect'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleRedirect", null);
__decorate([
    (0, common_1.Post)('assign-role'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "assignRole", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Get)('verify'),
    __param(0, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('resend-verification'),
    __param(0, (0, common_1.Body)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendVerificationEmail", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map