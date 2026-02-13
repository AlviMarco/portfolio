export class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    errorCode?: string;

    constructor(message: string, statusCode: number, errorCode?: string) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.errorCode = errorCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, field?: string) {
        super(message, 400, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401, 'AUTHENTICATION_ERROR');
        this.name = 'AuthenticationError';
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 403, 'AUTHORIZATION_ERROR');
        this.name = 'AuthorizationError';
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409, 'CONFLICT');
        this.name = 'ConflictError';
    }
}

export interface ErrorResponse {
    success: false;
    error: {
        message: string;
        code?: string;
        details?: any;
    };
    timestamp: string;
    path?: string;
}
