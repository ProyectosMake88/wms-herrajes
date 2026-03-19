import { Router } from 'express';
import notificationController from '../controllers/notification.controller';

const router = Router();

router.get('/', notificationController.getAll);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

export default router;
