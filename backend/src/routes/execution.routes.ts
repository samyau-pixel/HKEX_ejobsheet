import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, rbacMiddleware } from '../middleware/auth.middleware.js';
import { ExecutionService } from '../services/execution.service.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import Joi from 'joi';

const router = Router();

const createExecutionSchema = Joi.object({
  templateId: Joi.string().required(),
  name: Joi.string().max(500).optional(),
});

router.post('/', authMiddleware, rbacMiddleware('Operator', 'OperatorLeader', 'Manager'), validateRequest(createExecutionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) throw new Error('User ID missing');

    const { templateId, name } = req.body;
    const execution = await ExecutionService.createExecutionFromTemplate(userId, templateId, name);

    res.status(201).json({ status: 201, data: execution, message: 'Execution sheet created', requestId: req.headers['x-request-id'] || '' });
  } catch (err) {
    next(err);
  }
});

// POST /execution-sheets/:id/check-in
router.post('/:id/check-in', authMiddleware, rbacMiddleware('Operator', 'OperatorLeader', 'Manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) throw new Error('User ID missing');

    const execution = await ExecutionService.checkInExecution(req.params.id, userId);
    res.status(200).json({ status: 200, data: execution, message: 'Checked in', requestId: req.headers['x-request-id'] || '' });
  } catch (err) {
    next(err);
  }
});

// POST /execution-sheets/:id/jobs/:jobId/complete
router.post('/:id/jobs/:jobId/complete', authMiddleware, rbacMiddleware('Operator', 'OperatorLeader', 'Manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) throw new Error('User ID missing');

    const result = await ExecutionService.markJobComplete(req.params.id, req.params.jobId, userId);
    res.status(200).json({ status: 200, data: result, message: 'Job marked complete', requestId: req.headers['x-request-id'] || '' });
  } catch (err) {
    next(err);
  }
});

// POST /execution-sheets/:id/jobs/:jobId/uncomplete
router.post('/:id/jobs/:jobId/uncomplete', authMiddleware, rbacMiddleware('Operator', 'OperatorLeader', 'Manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) throw new Error('User ID missing');

    const result = await ExecutionService.unmarkJobComplete(req.params.id, req.params.jobId);
    res.status(200).json({ status: 200, data: result, message: 'Job marked incomplete', requestId: req.headers['x-request-id'] || '' });
  } catch (err) {
    next(err);
  }
});

// POST /execution-sheets/:id/complete
router.post('/:id/complete', authMiddleware, rbacMiddleware('Operator', 'OperatorLeader', 'Manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) throw new Error('User ID missing');

    const execution = await ExecutionService.completeExecutionSheet(req.params.id, userId);
    res.status(200).json({ status: 200, data: execution, message: 'Execution completed', requestId: req.headers['x-request-id'] || '' });
  } catch (err) {
    next(err);
  }
});

// GET /execution-sheets - list
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = (req.query.state as string) || undefined;
    const userId = req.auth?.role === 'Operator' ? req.auth.userId : undefined;
    const list = await ExecutionService.listExecutions(userId, state as any);
    res.status(200).json({ status: 200, data: list, message: 'Execution sheets retrieved', requestId: req.headers['x-request-id'] || '' });
  } catch (err) {
    next(err);
  }
});

// GET /execution-sheets/:id - detail
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const detail = await ExecutionService.getExecutionDetail(req.params.id);
    res.status(200).json({ status: 200, data: detail, message: 'Execution detail retrieved', requestId: req.headers['x-request-id'] || '' });
  } catch (err) {
    next(err);
  }
});

export default router;
