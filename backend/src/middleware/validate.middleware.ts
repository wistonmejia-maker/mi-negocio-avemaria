// Mi Negocio AVEMARÍA — Validation Middleware
// Valida request body, query params o route params con schemas Zod

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateBody(schema: ZodSchema) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                next(error);
            } else {
                next(error);
            }
        }
    };
}

export function validateQuery(schema: ZodSchema) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            req.query = schema.parse(req.query);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                next(error);
            } else {
                next(error);
            }
        }
    };
}

export function validateParams(schema: ZodSchema) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            req.params = schema.parse(req.params);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                next(error);
            } else {
                next(error);
            }
        }
    };
}
