import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorResponse, ValidationError, NotFoundError, ConflictError } from '../utils/errors';
import { config } from '../config';

const errorResponse = (res: Response, error: AppError, req?: Request): Response => {
    const response: ErrorResponse = {
        success: false,
        error: {
            message: error.message,
            code: error.errorCode,
        },
        timestamp: new Date().toISOString(),
    };

    if (config.nodeEnv === 'development') {
        response.error.details = error.stack;
        response.path = req?.path;
    }

    return res.status(error.statusCode).json(response);
};

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    console.error('Error:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
    });

    // Handle known error types
    if (err instanceof AppError) {
        errorResponse(res, err, req);
        return;
    }

    // Handle Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
        const prismaError = err as any;

        // Handle unique constraint violations
        if (prismaError.code === 'P2002') {
            const field = prismaError.meta?.target?.[0] || 'field';
            errorResponse(res, new ConflictError(`${field} already exists`), req);
            return;
        }

        // Handle record not found
        if (prismaError.code === 'P2025') {
            errorResponse(res, new NotFoundError('Record'), req);
            return;
        }
    }

    // Handle validation errors from body-parser
    if ((err as any).type === 'entity.parse.failed') {
        errorResponse(res, new ValidationError('Invalid JSON in request body'), req);
        return;
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        errorResponse(res, new ValidationError('Invalid token'), req);
        return;
    }

    if (err.name === 'TokenExpiredError') {
        errorResponse(res, new ValidationError('Token expired'), req);
        return;
    }

    // Handle unknown errors
    errorResponse(res, new AppError(
        config.nodeEnv === 'development' ? err.message : 'An unexpected error occurred',
        500
    ), req);
};

export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        success: false,
        error: {
            message: `Route ${req.method} ${req.path} not found`,
            code: 'NOT_FOUND',
        },
        timestamp: new Date().toISOString(),
    });
};

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
};
