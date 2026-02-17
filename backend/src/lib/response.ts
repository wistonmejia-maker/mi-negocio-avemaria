// Mi Negocio AVEMARÍA — Standard API Response Helpers

import { Response } from 'express';

interface SuccessOptions<T> {
    data: T;
    meta?: {
        total?: number;
        page?: number;
        limit?: number;
    };
    statusCode?: number;
}

export function sendSuccess<T>(res: Response, options: SuccessOptions<T>): void {
    const { data, meta, statusCode = 200 } = options;
    res.status(statusCode).json({
        success: true,
        data,
        ...(meta ? { meta } : {}),
    });
}

export function sendCreated<T>(res: Response, data: T): void {
    sendSuccess(res, { data, statusCode: 201 });
}
