import { Router } from 'express';
import companyController from '../controllers/company.controller';
import { adminOnly } from '../middlewares/auth.middleware';
import { uploadLogo } from '../config/uploadCompany';

const router = Router();

// Cualquier usuario autenticado puede ver el perfil de empresa
router.get('/', companyController.getProfile);

// Solo admin puede editar el perfil de empresa
router.put('/', adminOnly, uploadLogo.single('logo'), companyController.updateProfile);

export default router;
