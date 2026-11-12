import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';
import { rateLimit } from '../middlewares/rateLimit';

const router = Router();

// Limite estricto para mitigar ataques de fuerza bruta en credenciales
const limiteCredenciales = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Demasiados intentos de autenticación. Espere unos minutos e intente de nuevo.',
});

// Rutas publicas
router.post('/register', limiteCredenciales, AuthController.registrar);
router.post('/login', limiteCredenciales, AuthController.login);
router.post('/logout', AuthController.logout);

// Rutas protegidas
router.get('/profile', authenticateToken, AuthController.perfil);
router.put('/profile', authenticateToken, AuthController.actualizarPerfil);
router.put('/password', authenticateToken, AuthController.cambiarPassword);

export default router;
