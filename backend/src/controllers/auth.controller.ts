import type { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import type { RegisterInput, LoginInput } from '../validators/auth.validators';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = await authService.registerUser(req.body as RegisterInput);
    res.status(201).json({ success: true, token });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = await authService.loginUser(req.body as LoginInput);
    res.status(200).json({ success: true, token });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  // JWTs are stateless — logout is a client-side concern in v1.
  // v2 upgrade path: add token to a Redis blocklist checked in authenticate().
  res.status(200).json({ success: true, message: 'Logged out successfully' });
}

export async function unsubscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.deleteUser(req.user!.userId);
    res.status(200).json({ success: true, message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
}
