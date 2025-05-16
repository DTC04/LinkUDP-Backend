import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Res,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Solo en producción
  path: '/',
  sameSite: 'lax' as const, // 'lax' o 'strict'. 'lax' es un buen default.
  // maxAge: 24 * 60 * 60 * 1000, // Ejemplo: 1 día en milisegundos
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
    if (result && result.access_token) {
      res.cookie('access_token', result.access_token, {
        ...cookieOptions,
        // Podrías querer una duración más corta para el token de registro si es solo para onboarding
        // maxAge: 1 * 60 * 60 * 1000, // 1 hora por ejemplo
      });
      return result; // Devuelve el objeto completo { user: result.user, access_token: result.access_token }
    }
    // Manejar caso de error si register no devuelve lo esperado (aunque AuthService lanza error)
    throw new Error('Error durante el registro');
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    if (!result) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    res.cookie('access_token', result.access_token, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000, // 1 día para login normal
    });
    return result; // Devuelve el objeto completo { user: result.user, access_token: result.access_token }
  }

  @Post('logout') // O @Get, Post es a veces preferido para evitar CSRF si no hay payload
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', cookieOptions);
    return { message: 'Logout exitoso' };
  }

  // (Opcional) Endpoint para verificar el estado de autenticación (lee la cookie)
  // Necesitaría un Guard que use la JwtStrategy modificada
  /*
  @UseGuards(JwtAuthGuard) // Asumiendo que JwtAuthGuard usa la estrategia que lee cookies
  @Get('me')
  getProfile(@Request() req) {
    return req.user; // req.user es poblado por JwtStrategy.validate
  }
  */
}
