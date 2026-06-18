import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

let logger: any;
try {
  logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
      },
    },
  });
} catch (err) {
  // Fallback to a minimal console-based logger if pino transport fails to initialize
  // This prevents the whole app from crashing in environments where pino-pretty
  // cannot be resolved.
  // eslint-disable-next-line no-console
  console.error('[WARN] pino transport init failed, falling back to console logger', err);
  logger = {
    info: (...args: any[]) => console.log('[INFO]', ...args),
    error: (...args: any[]) => console.error('[ERROR]', ...args),
  } as any;
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('x-request-id', requestId);
  req.headers['x-request-id'] = requestId as string;
  next();
};

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'];
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      user: (req as any).auth?.userId,
    });
  });

  next();
};
