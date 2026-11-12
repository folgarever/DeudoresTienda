import { Router } from 'express';
import { HistorialController } from '../controllers/historialController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/cliente/:id', HistorialController.obtenerHistorialCliente);

export default router;
