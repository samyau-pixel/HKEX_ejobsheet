import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthPayload } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Missing or invalid authorization token',
      requestId: res.getHeader('x-request-id') || '',
    });
    return;
  }

  const token = authHeader.substring(7);
  const payload = AuthService.verifyToken(token);

  if (!payload || AuthService.isTokenExpired(payload)) {
    res.status(401).json({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
      requestId: res.getHeader('x-request-id') || '',
    });
    return;
  }

  req.auth = payload;
  next();
};

export const rbacMiddleware =
  (...allowedRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
        requestId: res.getHeader('x-request-id') || '',
      });
      return;
    }

    if (!allowedRoles.includes(req.auth.role)) {
      res.status(403).json({
        status: 403,
        code: 'FORBIDDEN',
        message: `Insufficient permission. This action requires ${allowedRoles.join(' or ')} role`,
        requestId: res.getHeader('x-request-id') || '',
      });
      return;
    }

    next();
  };
