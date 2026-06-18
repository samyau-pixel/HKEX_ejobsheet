import { Router, Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/user.model.js';
import { AuthService } from '../services/auth.service.js';
import { validateRequest, loginSchema } from '../middleware/validation.middleware.js';
import { ApiError } from '../middleware/error.middleware.js';

const router = Router();

// POST /auth/login - simple email/password login returning JWT
router.post(
  '/login',
  validateRequest(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      const user = (await UserModel.getUserByEmail(email)) as any;
      if (!user) {
        throw new ApiError(401, 'UNAUTHORIZED', 'Invalid credentials');
      }

      const ok = await UserModel.verifyPassword(user.password, password);
      if (!ok) {
        throw new ApiError(401, 'UNAUTHORIZED', 'Invalid credentials');
      }

      const token = AuthService.generateToken(user as any);

      res.status(200).json({
        status: 200,
        data: { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } },
        message: 'Login successful',
        requestId: req.headers['x-request-id'] || '',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
