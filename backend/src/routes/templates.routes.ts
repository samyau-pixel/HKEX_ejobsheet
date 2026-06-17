import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, rbacMiddleware } from '../middleware/auth.middleware.js';
import { validateRequest, templateSchema } from '../middleware/validation.middleware.js';
import { TemplateService } from '../services/template.service.js';
import { ApiError } from '../middleware/error.middleware.js';

const router = Router();

// POST /templates - Create new template
router.post(
  '/',
  authMiddleware,
  rbacMiddleware('Operator', 'OperatorLeader', 'Manager'),
  validateRequest(templateSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new ApiError(401, 'UNAUTHORIZED', 'User ID not found in token');
      }

      const template = await TemplateService.createTemplate(userId, req.body);

      res.status(201).json({
        status: 201,
        data: template,
        message: 'Template created successfully',
        requestId: req.headers['x-request-id'] || '',
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /templates - List templates
router.get(
  '/',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const state = (req.query.state as string) || undefined;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      let userId: string | undefined;
      if (req.auth?.role === 'Operator') {
        userId = req.auth.userId;
      }

      const templates = await TemplateService.listTemplates(userId, state, limit, offset);

      res.status(200).json({
        status: 200,
        data: templates,
        message: 'Templates retrieved successfully',
        requestId: req.headers['x-request-id'] || '',
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /templates/:id - Get template with jobs and procedures
router.get(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const template = await TemplateService.getTemplate(req.params.id);

      res.status(200).json({
        status: 200,
        data: template,
        message: 'Template retrieved successfully',
        requestId: req.headers['x-request-id'] || '',
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /templates/:id/approve - Approve template
router.post(
  '/:id/approve',
  authMiddleware,
  rbacMiddleware('Manager'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await TemplateService.approveTemplate(req.params.id);
      const template = await TemplateService.getTemplate(req.params.id);

      res.status(200).json({
        status: 200,
        data: template,
        message: 'Template approved successfully',
        requestId: req.headers['x-request-id'] || '',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
