export class HttpError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.name = 'HttpError';
        this.statusCode = statusCode;
        this.details = details;
    }
}

export const httpError = (statusCode, message, details = null) => new HttpError(statusCode, message, details);

export const asyncHandler = (handler) => (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
};

export const sendError = (error, res) => {
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    const payload = {
        error: error?.message || 'Internal server error',
    };

    if (error?.details) {
        payload.details = error.details;
    }

    res.status(statusCode).json(payload);
};
