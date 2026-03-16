import { Router } from 'express';
import * as budgetController from '../controllers/budget.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createBudgetSchema, updateBudgetSchema, budgetIdParamsSchema } from '../validators/budget.validators';

const router = Router();

// All budget routes require authentication
router.use(authenticate);

router.post('/',                       validate(createBudgetSchema),   budgetController.create);
router.get('/:id',                     validate(budgetIdParamsSchema, 'params'), budgetController.getById);
router.get('/:id/transactions',        validate(budgetIdParamsSchema, 'params'), budgetController.getTransactions);
router.patch('/:id',                   validate(budgetIdParamsSchema, 'params'), validate(updateBudgetSchema), budgetController.update);
router.delete('/:id',                  validate(budgetIdParamsSchema, 'params'), budgetController.remove);

export default router;
