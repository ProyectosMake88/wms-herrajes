import { Router } from 'express';
import categoryController from '../controllers/category.controller';
import { validateCategory, validateId } from '../middlewares/validation.middleware';

const router = Router();

router.get('/', categoryController.getAll);
router.get('/:id', validateId, categoryController.getById);
router.post('/', validateCategory, categoryController.create);
router.put('/:id', validateId, categoryController.update);
router.delete('/:id', validateId, categoryController.delete);

export default router;
