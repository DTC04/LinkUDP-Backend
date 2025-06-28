import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Res,
  HttpStatus,
  HttpException,
  Get,
  Req,
  UseGuards, 
  HttpCode, 
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, Role } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GetUser } from './get-user.decorator';
<<<<<<< HEAD
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { Public } from './public.decorator';
import { ResetPasswordDto } from './dto/reset-password.dto'
=======
import { Query } from '@nestjs/common';
>>>>>>> 913936c99bd0943bc281d1d0c0047e5434fa602f

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  sameSite: 'lax' as const,
  maxAge: 24 * 60 * 60 * 1000, // 1 día
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    if (result?.access_token && typeof result.access_token === 'string') {
      res.cookie('access_token', result.access_token, cookieOptions);
      return result;
    }
    throw new Error('Error durante el registro');
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    if (!result || typeof result.access_token !== 'string') {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    res.cookie('access_token', result.access_token, cookieOptions);
    return result;
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', cookieOptions);
    return { message: 'Logout exitoso' };
  }

// este es para solicitar el correo
  @Post('forgot-password')
  @Public()
  @HttpCode(200)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    try {
      await this.authService.forgotPassword(body.email);
    } catch (err) {
      throw new HttpException('Error al enviar el correo', 500);
    }
  }

//este para resetear la contraseña
@Post('reset-password')
@Public()
async resetPassword(@Body() body: ResetPasswordDto) {
  try {
    await this.authService.resetPassword(body.token, body.password);
  } catch (err) {
    throw new HttpException(err.message || 'Error al restablecer la contraseña', 400);
  }
}


  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Redirección a Google
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleRedirect(
    @Req() req: Request & { user?: any },
    @Res() res: Response,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('Usuario de Google no disponible');
    }

    const { token, isNewUser, user } = await this.authService.loginWithGoogle(req.user);

    if (!token || typeof token !== 'string') {
      throw new Error('Fallo al generar el token de Google');
    }

    res.cookie('access_token', token, cookieOptions);

    let redirectTo = 'http://localhost:3001/dashboard';
    if (isNewUser) {
      redirectTo = 'http://localhost:3001/onboarding/select-role';
    } else if (user.role === Role.STUDENT) {
      redirectTo = 'http://localhost:3001/dashboard/student';
    } else if (user.role === Role.TUTOR) {
      redirectTo = 'http://localhost:3001/dashboard/tutor';
    }

    res.redirect(redirectTo);
  }



  @Post('assign-role')
  async assignRole(
    @Body() body: { role: Role; userId: number },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { userId, role } = body;

    if (role !== Role.STUDENT && role !== Role.TUTOR) {
      throw new HttpException(
        'Rol inválido. Solo se permite STUDENT o TUTOR.',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.authService.assignRole(userId, role);

    const user = await this.authService['prisma'].user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const token = this.authService['jwt'].sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    res.cookie('access_token', token, cookieOptions);

    const redirectTo =
      role === Role.STUDENT
        ? 'http://localhost:3001/onboarding/student'
        : 'http://localhost:3001/onboarding/tutor';

    return { message: 'Rol asignado', redirectTo };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@GetUser() user: any) {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  @Get('verify')
  async verifyEmail(@Query('token') token: string) {
    try {
      const payload = await this.authService.verifyEmailToken(token);
      return { message: 'Correo verificado con éxito.' };
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado.');
    }
  }

  @Post('resend-verification')
  async resendVerificationEmail(@Body('email') email: string) {
    await this.authService.resendVerificationEmail(email);
    return { message: 'Se ha reenviado un nuevo enlace de verificación.' };
  }
}
