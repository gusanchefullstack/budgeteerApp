import type { Request, Response, NextFunction } from 'express';
import * as budgetService from '../services/budget.service';
import type { CreateBudgetInput, UpdateBudgetInput } from '../validators/budget.validators';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const budget = await budgetService.createBudget(req.user!.userId, req.body as CreateBudgetInput);
    res.status(201).json({ success: true, data: budget });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const budget = await budgetService.getBudgetById(req.params.id as string, req.user!.userId);
    res.status(200).json({ success: true, data: budget });
  } catch (err) {
    next(err);
  }
}

export async function getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const transactions = await budgetService.getBudgetTransactions(req.params.id as string, req.user!.userId);
    res.status(200).json({ success: true, data: transactions });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const budget = await budgetService.updateBudget(
      req.params.id as string,
      req.user!.userId,
      req.body as UpdateBudgetInput,
    );
    res.status(200).json({ success: true, data: budget });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await budgetService.deleteBudget(req.params.id as string, req.user!.userId);
    res.status(200).json({ success: true, message: 'Budget deleted' });
  } catch (err) {
    next(err);
  }
}
