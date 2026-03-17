import { Router } from 'express';
import * as budgetController from '../controllers/budget.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  createBudgetSchema, updateBudgetSchema, budgetIdParamsSchema,
  createCategorySchema, updateCategorySchema, deleteCategorySchema,
  createGroupSchema, updateGroupSchema, deleteGroupSchema,
  createItemSchema, updateItemSchema, deleteItemSchema,
} from '../validators/budget.validators';

const router = Router();

// All budget routes require authentication
router.use(authenticate);

const id = validate(budgetIdParamsSchema, 'params');

// ─── Budget CRUD ──────────────────────────────────────────────────────────────
router.post('/',                    validate(createBudgetSchema),            budgetController.create);
router.get('/:id',                  id,                                      budgetController.getById);
router.get('/:id/transactions',     id,                                      budgetController.getTransactions);
router.patch('/:id',                id, validate(updateBudgetSchema),        budgetController.update);
router.delete('/:id',               id,                                      budgetController.remove);

// ─── Category sub-routes ──────────────────────────────────────────────────────
router.post('/:id/category',        id, validate(createCategorySchema),      budgetController.addCategory);
router.patch('/:id/category',       id, validate(updateCategorySchema),      budgetController.updateCategory);
router.delete('/:id/category',      id, validate(deleteCategorySchema),      budgetController.deleteCategory);

// ─── Group sub-routes ─────────────────────────────────────────────────────────
router.post('/:id/group',           id, validate(createGroupSchema),         budgetController.addGroup);
router.patch('/:id/group',          id, validate(updateGroupSchema),         budgetController.updateGroup);
router.delete('/:id/group',         id, validate(deleteGroupSchema),         budgetController.deleteGroup);

// ─── Item sub-routes ──────────────────────────────────────────────────────────
router.post('/:id/item',            id, validate(createItemSchema),          budgetController.addItem);
router.patch('/:id/item',           id, validate(updateItemSchema),          budgetController.updateItem);
router.delete('/:id/item',          id, validate(deleteItemSchema),          budgetController.deleteItem);

export default router;
