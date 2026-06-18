import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { requestIdMiddleware, loggingMiddleware } from './middleware/logging.middleware.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import templatesRoutes from './routes/templates.routes.js';
import authRoutes from './routes/auth.routes.js';
import executionRoutes from './routes/execution.routes.js';

dotenv.config();

const app: Express = express();

// Middleware
app.use(requestIdMiddleware);
app.use(loggingMiddleware);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API version endpoint
app.get('/api/version', (_req: Request, res: Response) => {
  res.json({
    version: '1.0.0',
    name: 'Jobsheet Management System',
    timestamp: new Date().toISOString(),
  });
});

// Routes will be added here
app.use('/api/templates', templatesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/execution-sheets', executionRoutes);
// app.use('/api/execution', executionRoutes);
// etc.

// Error handling
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 404,
    code: 'NOT_FOUND',
    message: 'Endpoint not found',
    requestId: req.headers['x-request-id'] || 'unknown',
  });
});

app.use(errorMiddleware);

export default app;
