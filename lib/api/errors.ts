/**
 * API Error Handling Utilities
 *
 * Provides standardized error classes and handlers for consistent
 * API error responses across all routes.
 */

import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

/**
 * Standardized error handler for API routes
 * Returns consistent JSON error responses
 *
 * @param error - Any error thrown in the API route
 * @returns NextResponse with standardized error format
 *
 * @example
 * export async function POST(request: Request) {
 *   try {
 *     const user = await getUser();
 *     if (!user) throw new UnauthorizedError();
 *     // ... rest of logic
 *   } catch (error) {
 *     return handleApiError(error);
 *   }
 * }
 */
export function handleApiError(error: unknown): Response {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    const response: Record<string, unknown> = {
      error: error.message,
      code: error.code,
    };

    if (error.details) {
      response.details = error.details;
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  // Unexpected errors (generic Error, strings, etc.)
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}
