import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
}

/**
 * Global Backend Error Handler Middleware
 */
export const globalErrorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const status = err.status || 'error';

    console.error('🔥 Backend API Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    // Handle specific technical errors professionally
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            status: 'fail',
            message: 'Invalid input data.',
            errors: err.message
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: 'fail',
            message: 'Invalid token. Please log in again.'
        });
    }

    // Generic handled/unhandled error response
    res.status(statusCode).json({
        status: status,
        message: err.isOperational ? err.message : 'An internal server error occurred. Please try again later.',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
