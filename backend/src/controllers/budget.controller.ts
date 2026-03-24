import type { Request, Response, NextFunction } from 'express';
import * as budgetService from '../services/budget.service';
import type {
  CreateBudgetInput, UpdateBudgetInput,
  CreateCategoryInput, UpdateCategoryInput, DeleteCategoryInput,
  CreateGroupInput, UpdateGroupInput, DeleteGroupInput,
  CreateItemInput, UpdateItemInput, DeleteItemInput,
} from '../validators/budget.validators';

export async function getMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const budget = await budgetService.getBudgetByUser(req.user!.userId);
    res.status(200).json({ success: true, data: budget ?? null });
  } catch (err) {
    next(err);
  }
}

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

// ─── Category controllers ─────────────────────────────────────────────────────

export async function addCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const budget = await budgetService.addCategory(req.params.id as string, req.user!.userId, req.body as CreateCategoryInput);
    res.status(201).json({ success: true, data: budget });
  } catch (err) { next(err); }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const budget = await budgetService.updateCategory(req.params.id as string, req.user!.userId, req.body as UpdateCategoryInput);
    res.status(200).json({ success: true, data: budget });
  } catch (err) { next(err); }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await budgetService.deleteCategory(req.params.id as string, req.user!.userId, req.body as DeleteCategoryInput);
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
}

// ─── Group controllers ────────────────────────────────────────────────────────

export async function addGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const budget = await budgetService.addGroup(req.params.id as string, req.user!.userId, req.body as CreateGroupInput);
    res.status(201).json({ success: true, data: budget });
  } catch (err) { next(err); }
}

export async function updateGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const budget = await budgetService.updateGroup(req.params.id as string, req.user!.userId, req.body as UpdateGroupInput);
    res.status(200).json({ success: true, data: budget });
  } catch (err) { next(err); }
}

export async function deleteGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await budgetService.deleteGroup(req.params.id as string, req.user!.userId, req.body as DeleteGroupInput);
    res.status(200).json({ success: true, message: 'Group deleted' });
  } catch (err) { next(err); }
}

// ─── Item controllers ─────────────────────────────────────────────────────────

export async function addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const budget = await budgetService.addItem(req.params.id as string, req.user!.userId, req.body as CreateItemInput);
    res.status(201).json({ success: true, data: budget });
  } catch (err) { next(err); }
}

export async function updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const budget = await budgetService.updateItem(req.params.id as string, req.user!.userId, req.body as UpdateItemInput);
    res.status(200).json({ success: true, data: budget });
  } catch (err) { next(err); }
}

export async function deleteItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await budgetService.deleteItem(req.params.id as string, req.user!.userId, req.body as DeleteItemInput);
    res.status(200).json({ success: true, message: 'Item deleted' });
  } catch (err) { next(err); }
}
