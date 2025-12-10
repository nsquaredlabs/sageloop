import { describe, it, expect } from 'vitest';
import {
  ApiError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  handleApiError,
} from '@/lib/api/errors';

/**
 * API Error Handling Tests (Sprint 2 - Issue #6)
 *
 * Tests standardized error utilities for consistent API error responses.
 */

describe('Error Classes', () => {
  it('should create ApiError with all properties', () => {
    const error = new ApiError(500, 'Server error', 'SERVER_ERROR', { detail: 'test' });

    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Server error');
    expect(error.code).toBe('SERVER_ERROR');
    expect(error.details).toEqual({ detail: 'test' });
    expect(error.name).toBe('ApiError');
  });

  it('should create ValidationError with 400 status', () => {
    const error = new ValidationError('Invalid input', { field: 'email' });

    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Invalid input');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details).toEqual({ field: 'email' });
  });

  it('should create NotFoundError with 404 status', () => {
    const error = new NotFoundError('Project');

    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Project not found');
    expect(error.code).toBe('NOT_FOUND');
  });

  it('should create UnauthorizedError with 401 status', () => {
    const error = new UnauthorizedError();

    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Unauthorized');
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('should create UnauthorizedError with custom message', () => {
    const error = new UnauthorizedError('Invalid token');

    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Invalid token');
    expect(error.code).toBe('UNAUTHORIZED');
  });
});

describe('handleApiError', () => {
  it('should handle ApiError with all fields', () => {
    const error = new ApiError(
      403,
      'Forbidden',
      'FORBIDDEN',
      { requiredRole: 'admin' }
    );

    const response = handleApiError(error);
    const json = response.json();

    expect(response.status).toBe(403);
    expect(json).resolves.toEqual({
      error: 'Forbidden',
      code: 'FORBIDDEN',
      details: { requiredRole: 'admin' },
    });
  });

  it('should handle ValidationError', () => {
    const error = new ValidationError('Email is required');

    const response = handleApiError(error);
    const json = response.json();

    expect(response.status).toBe(400);
    expect(json).resolves.toEqual({
      error: 'Email is required',
      code: 'VALIDATION_ERROR',
    });
  });

  it('should handle NotFoundError', () => {
    const error = new NotFoundError('User');

    const response = handleApiError(error);
    const json = response.json();

    expect(response.status).toBe(404);
    expect(json).resolves.toEqual({
      error: 'User not found',
      code: 'NOT_FOUND',
    });
  });

  it('should handle UnauthorizedError', () => {
    const error = new UnauthorizedError();

    const response = handleApiError(error);
    const json = response.json();

    expect(response.status).toBe(401);
    expect(json).resolves.toEqual({
      error: 'Unauthorized',
      code: 'UNAUTHORIZED',
    });
  });

  it('should handle generic Error as internal server error', () => {
    const error = new Error('Something went wrong');

    const response = handleApiError(error);
    const json = response.json();

    expect(response.status).toBe(500);
    expect(json).resolves.toEqual({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  });

  it('should handle string error as internal server error', () => {
    const error = 'String error message';

    const response = handleApiError(error);
    const json = response.json();

    expect(response.status).toBe(500);
    expect(json).resolves.toEqual({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  });

  it('should handle null/undefined as internal server error', () => {
    const response = handleApiError(null);
    const json = response.json();

    expect(response.status).toBe(500);
    expect(json).resolves.toEqual({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  });

  it('should not include details field if details is undefined', () => {
    const error = new ApiError(500, 'Server error', 'SERVER_ERROR');

    const response = handleApiError(error);
    const json = response.json();

    expect(json).resolves.not.toHaveProperty('details');
  });
});

describe('Error inheritance', () => {
  it('should be instance of Error', () => {
    const error = new ApiError(500, 'Test');
    expect(error instanceof Error).toBe(true);
  });

  it('should be instance of ApiError', () => {
    const validationError = new ValidationError('Test');
    const notFoundError = new NotFoundError('Resource');
    const unauthorizedError = new UnauthorizedError();

    expect(validationError instanceof ApiError).toBe(true);
    expect(notFoundError instanceof ApiError).toBe(true);
    expect(unauthorizedError instanceof ApiError).toBe(true);
  });

  it('should work with try-catch', () => {
    try {
      throw new ValidationError('Invalid data');
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
      expect(error instanceof ApiError).toBe(true);
      if (error instanceof ApiError) {
        expect(error.statusCode).toBe(400);
      }
    }
  });
});
