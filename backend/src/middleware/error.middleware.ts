import { Request, Response, NextFunction } from 'express';
import pino from 'pino';

const logger = pino();

export const errorMiddleware = (err: any, req: Request, res: Response, _next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] || 'unknown';

  logger.error({
    requestId,
    error: err.message,
    stack: err.stack,
  });

  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal server error';

  res.status(status).json({
    status,
    code,
    message,
    requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
