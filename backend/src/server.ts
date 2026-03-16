import 'dotenv/config';
import express from 'express';
import apiRouter from './routes/index';
import { errorHandler } from './middleware/errorHandler';
import { AppError } from './middleware/AppError';

const app = express();

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/v1', apiRouter);

// 404 handler for unmatched routes
app.use((_req, _res, next) => {
  next(new AppError(404, 'Route not found'));
});

// Global error handler — must be last
app.use(errorHandler);

export default app;
