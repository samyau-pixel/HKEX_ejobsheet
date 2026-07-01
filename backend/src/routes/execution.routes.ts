import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, rbacMiddleware } from '../middleware/auth.middleware.js';
import { ExecutionService } from '../services/execution.service.js';
import { LeaderReviewService } from '../services/leader-review.service.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import Joi from 'joi';

const router = Router();

const createExecutionSchema = Joi.object({
  templateId: Joi.string().required(),
  name: Joi.string().max(500).optional(),
});

const leaderReviewSchema = Joi.object({
  userId: Joi.string().required(),
  password: Joi.string().required(),
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
// Note: Do not limit Operators to their own created sheets; all roles should see created executions
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = (req.query.state as string) || undefined;
    // Pass undefined userId to list all executions regardless of creator
    const list = await ExecutionService.listExecutions(undefined, state as any);
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

// POST /execution-sheets/:id/jobs/:jobId/leader-review
// Allow any authenticated user (including Operator) to submit a leader review
router.post('/:id/jobs/:jobId/leader-review', authMiddleware, rbacMiddleware('Operator', 'OperatorLeader', 'Manager'), validateRequest(leaderReviewSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, password } = req.body;
    const { id: executionId, jobId } = req.params;

    const result = await LeaderReviewService.submitLeaderReview(executionId, jobId, userId, password);

    if (!result.success) {
      return res.status(401).json({ 
        status: 401, 
        error: result.error, 
        message: result.message, 
        requestId: req.headers['x-request-id'] || '' 
      });
    }

    return res.status(200).json({ status: 200, data: result, message: result.message, requestId: req.headers['x-request-id'] || '' });
  } catch (err) {
    return next(err);
  }
});

// GET /execution-sheets/:id/jobs/:jobId/leader-review
router.get('/:id/jobs/:jobId/leader-review', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: executionId, jobId } = req.params;
    const status = await LeaderReviewService.getJobReviewStatus(executionId, jobId);
    res.status(200).json({ status: 200, data: status, message: 'Leader review status retrieved', requestId: req.headers['x-request-id'] || '' });
  } catch (err) {
    next(err);
  }
});

// GET /execution-sheets/:id/leader-review-summary
router.get('/:id/leader-review-summary', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: executionId } = req.params;
    const summary = await LeaderReviewService.checkAllJobsReviewed(executionId);
    const reviews = await LeaderReviewService.getExecutionReviews(executionId);
    
    res.status(200).json({ 
      status: 200, 
      data: { ...summary, reviews }, 
      message: 'Leader review summary retrieved', 
      requestId: req.headers['x-request-id'] || '' 
    });
  } catch (err) {
    next(err);
  }
});

export default router;
