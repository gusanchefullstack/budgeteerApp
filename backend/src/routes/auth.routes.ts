import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/auth.validators';

const router = Router();

router.post('/register',     validate(registerSchema), authController.register);
router.post('/login',        validate(loginSchema),    authController.login);
router.post('/logout',       authenticate,             authController.logout);
router.post('/unsubscribe',  authenticate,             authController.unsubscribe);

export default router;
