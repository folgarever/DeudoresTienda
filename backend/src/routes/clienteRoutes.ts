import { Router } from 'express';
import { ClienteController } from '../controllers/clienteController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Todas las rutas de clientes requieren autenticacion
router.use(authenticateToken);

router.get('/', ClienteController.listar);
router.post('/', ClienteController.crear);
router.get('/:id', ClienteController.obtenerPorId);
router.put('/:id', ClienteController.actualizar);
router.patch('/:id/reactivar', ClienteController.reactivar);
router.delete('/:id', ClienteController.desactivar);

export default router;
