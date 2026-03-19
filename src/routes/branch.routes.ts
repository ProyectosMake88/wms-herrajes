import { Router } from 'express';
import branchController from '../controllers/branch.controller';
import { adminOnly } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', branchController.getAll);
router.get('/:id', branchController.getById);
router.post('/', adminOnly, branchController.create);
router.put('/:id', adminOnly, branchController.update);
router.delete('/:id', adminOnly, branchController.delete);

export default router;
