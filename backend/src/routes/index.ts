import { Router } from 'express';
import authRoutes        from './auth.routes';
import budgetRoutes      from './budget.routes';
import transactionRoutes from './transaction.routes';

const router = Router();

router.use('/auth',         authRoutes);
router.use('/budget',       budgetRoutes);
router.use('/transactions', transactionRoutes);

export default router;
