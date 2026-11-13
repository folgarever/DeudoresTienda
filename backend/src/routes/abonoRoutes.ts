import { Router } from 'express';
import { AbonoController } from '../controllers/abonoController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Todas las rutas de abonos requieren autenticacion
router.use(authenticateToken);

router.get('/', AbonoController.listar);
router.post('/', AbonoController.registrar);
router.get('/:id', AbonoController.obtenerPorId);
router.post('/:id/anular', AbonoController.anular);

export default router;
