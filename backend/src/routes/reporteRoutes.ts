import { Router } from 'express';
import { ReporteController } from '../controllers/reporteController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/resumen', ReporteController.resumenCaja);

export default router;
