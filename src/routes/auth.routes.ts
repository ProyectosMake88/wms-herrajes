import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authMiddleware, adminOnly } from '../middlewares/auth.middleware';
import { uploadAvatar } from '../config/uploadAvatar';

const router = Router();

// Público
router.post('/login', authController.login);

// Protegido - cualquier usuario autenticado
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, uploadAvatar.single('avatar'), authController.updateProfile);

// Protegido - solo admin
router.get('/users', authMiddleware, adminOnly, authController.getUsers);
router.post('/users', authMiddleware, adminOnly, authController.createUser);
router.put('/users/:id', authMiddleware, adminOnly, authController.updateUser);
router.delete('/users/:id', authMiddleware, adminOnly, authController.deleteUser);

export default router;
