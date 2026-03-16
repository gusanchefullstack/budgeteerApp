import { Router } from 'express';
import * as txController from '../controllers/transaction.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  createTransactionSchema,
  transactionQuerySchema,
  transactionIdParamsSchema,
} from '../validators/transaction.validators';

const router = Router();

// All transaction routes require authentication
router.use(authenticate);

// NOTE: /q must be registered before /:id to avoid Express matching "q" as an id param
router.post('/',   validate(createTransactionSchema),          txController.create);
router.get('/',                                                 txController.getAll);
router.get('/q',   validate(transactionQuerySchema, 'query'),  txController.getFiltered);
router.get('/:id', validate(transactionIdParamsSchema, 'params'), txController.getById);

export default router;
