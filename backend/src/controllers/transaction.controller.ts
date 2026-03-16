import type { Request, Response, NextFunction } from 'express';
import * as txService from '../services/transaction.service';
import type { CreateTransactionInput, TransactionQuery } from '../validators/transaction.validators';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tx = await txService.createTransaction(req.user!.userId, req.body as CreateTransactionInput);
    res.status(201).json({ success: true, data: tx });
  } catch (err) {
    next(err);
  }
}

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const txs = await txService.getTransactions(req.user!.userId);
    res.status(200).json({ success: true, data: txs });
  } catch (err) {
    next(err);
  }
}

export async function getFiltered(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const txs = await txService.getFilteredTransactions(
      req.user!.userId,
      req.query as unknown as TransactionQuery,
    );
    res.status(200).json({ success: true, data: txs });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tx = await txService.getTransactionById(req.user!.userId, req.params.id as string);
    res.status(200).json({ success: true, data: tx });
  } catch (err) {
    next(err);
  }
}
