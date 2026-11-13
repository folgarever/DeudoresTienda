import { Router } from 'express';
import { ProductoController } from '../controllers/productoController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Todas las rutas de productos requieren autenticacion
router.use(authenticateToken);

router.get('/', ProductoController.listar);
router.post('/', ProductoController.crear);
router.get('/categorias', ProductoController.listarCategorias);
router.get('/:id', ProductoController.obtenerPorId);
router.put('/:id', ProductoController.actualizar);
router.patch('/:id/reactivar', ProductoController.reactivar);
router.delete('/:id', ProductoController.desactivar);

export default router;
