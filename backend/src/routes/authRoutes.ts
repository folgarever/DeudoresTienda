import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Rutas publicas
router.post('/register', AuthController.registrar);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);

// Rutas protegidas
router.get('/profile', authenticateToken, AuthController.perfil);

export default router;
