import { Router } from 'express';
import pendingEntryController from '../controllers/pendingEntry.controller';
import { authMiddleware, adminOnly } from '../middlewares/auth.middleware';

const router = Router();

// Vendedor crea solicitud
router.post('/', pendingEntryController.create);

// Admin lista y gestiona
router.get('/', adminOnly, pendingEntryController.getAll);
router.put('/:id/approve', adminOnly, pendingEntryController.approve);
router.put('/:id/reject', adminOnly, pendingEntryController.reject);

export default router;
