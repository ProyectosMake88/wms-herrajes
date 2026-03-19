import { Router } from 'express';
import organizationController from '../controllers/organization.controller';
import { superAdminOnly } from '../middlewares/auth.middleware';
import { uploadLogo } from '../config/uploadCompany';

const router = Router();

// Solo SUPER_ADMIN puede gestionar organizaciones
router.get('/stats', superAdminOnly, organizationController.getStats);
router.get('/', superAdminOnly, organizationController.getAll);
router.get('/:id', superAdminOnly, organizationController.getById);
router.post('/', superAdminOnly, organizationController.create);
router.put('/:id', superAdminOnly, uploadLogo.single('logo'), organizationController.update);
router.put('/:id/toggle', superAdminOnly, organizationController.toggleActive);

export default router;
