import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        error: detail.message,
      }));

      res.status(422).json({
        status: 422,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
        requestId: req.headers['x-request-id'] || '',
      });
      return;
    }

    req.body = value;
    next();
  };
};

// Common validation schemas
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const procedureSchema = Joi.object({
  name: Joi.string().max(500).required(),
  description: Joi.string().allow('').optional(),
  order: Joi.number().integer().required(),
});

export const jobSchema = Joi.object({
  name: Joi.string().max(500).required(),
  description: Joi.string().allow('').optional(),
  order: Joi.number().integer().required(),
  expectedStart: Joi.date().iso().optional(),
  expectedEnd: Joi.date().iso().optional(),
  timeDependency: Joi.date().iso().optional(),
  prerequisiteOrders: Joi.array().items(Joi.number().integer()).optional(),
  procedures: Joi.array().items(procedureSchema).min(1).required(),
});

export const templateSchema = Joi.object({
  name: Joi.string().max(500).required(),
  description: Joi.string().allow('').optional(),
  jobs: Joi.array().items(jobSchema).min(1).required(),
});
