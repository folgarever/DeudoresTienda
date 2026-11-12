import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

export class AuthController {
  static async registrar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { nombres, apellidos, email, username, password } = req.body;
      const resultado = await AuthService.registrar({
        nombres,
        apellidos,
        email,
        username,
        password,
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: resultado,
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { usernameOrEmail, password } = req.body;
      const resultado = await AuthService.login({
        usernameOrEmail,
        password,
      });

      res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: resultado,
      });
    } catch (err) {
      next(err);
    }
  }

  static async perfil(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        return;
      }

      const usuario = await AuthService.obtenerPerfil(req.user.id);

      res.status(200).json({
        success: true,
        data: usuario,
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });
  }
}
