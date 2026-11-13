import { Router } from 'express';
import { CompraController } from '../controllers/compraController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Todas las rutas de compras requieren autenticacion
router.use(authenticateToken);

router.get('/', CompraController.listar);
router.post('/', CompraController.registrar);
router.get('/:id', CompraController.obtenerPorId);
router.post('/:id/anular', CompraController.anular);

export default router;
