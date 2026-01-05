/**
 * Rate Limiting Middleware
 *
 * Prevents:
 * - CWE-400: Resource Exhaustion (DoS)
 * - Brute force attacks
 * - API abuse
 *
 * Based on SUSVIBES research findings and OWASP recommendations
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting
// In production, use Redis or similar distributed store
const rateLimitStore: RateLimitStore = {};

// Cleanup old entries every 10 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const key in rateLimitStore) {
      if (rateLimitStore[key].resetTime < now) {
        delete rateLimitStore[key];
      }
    }
  },
  10 * 60 * 1000,
);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Custom identifier function (defaults to IP address)
   */
  keyGenerator?: (request: Request) => string;

  /**
   * Message to return when rate limit is exceeded
   */
  message?: string;
}

/**
 * Default rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  // Auth endpoints - very strict
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "Too many authentication attempts. Please try again later.",
  },

  // OAuth callback endpoints - allows for user retries
  oauthCallback: {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 10 callbacks per 15 min (allows retries)
    message:
      "Too many sign-in attempts. Please wait a few minutes and try again.",
  },

  // API endpoints - moderate
  api: {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many requests. Please try again later.",
  },

  // Generation endpoints - strict (expensive operations)
  generation: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many generation requests. Please try again later.",
  },

  // Export endpoints - moderate
  export: {
    maxRequests: 30,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Too many export requests. Please try again later.",
  },
} as const;

/**
 * Get client identifier from request
 */
function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (Vercel/proxy)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier
  // In production with Vercel, x-forwarded-for should always be present
  return "unknown";
}

/**
 * Check if request is within rate limit
 */
export function checkRateLimit(
  request: Request,
  config: RateLimitConfig,
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const identifier = config.keyGenerator
    ? config.keyGenerator(request)
    : getClientIdentifier(request);

  const now = Date.now();
  const key = `${identifier}:${config.windowMs}`;

  // Get or create rate limit entry
  let entry = rateLimitStore[key];

  if (!entry || entry.resetTime < now) {
    // Create new entry
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    rateLimitStore[key] = entry;
  }

  // Increment request count
  entry.count++;

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const allowed = entry.count <= config.maxRequests;

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limit middleware for API routes
 *
 * Usage:
 * ```typescript
 * export async function POST(request: Request) {
 *   const rateLimitResult = await rateLimit(request, RATE_LIMITS.api);
 *   if (!rateLimitResult.allowed) {
 *     return rateLimitResult.response;
 *   }
 *
 *   // Continue with request handling
 * }
 * ```
 */
export async function rateLimit(
  request: Request,
  config: RateLimitConfig,
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  response?: Response;
}> {
  const result = checkRateLimit(request, config);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

    return {
      ...result,
      response: new Response(
        JSON.stringify({
          error: config.message || "Rate limit exceeded",
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": result.resetTime.toString(),
          },
        },
      ),
    };
  }

  return result;
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  config: RateLimitConfig,
  result: { remaining: number; resetTime: number },
): Response {
  const headers = new Headers(response.headers);
  headers.set("X-RateLimit-Limit", config.maxRequests.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", result.resetTime.toString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Higher-order function to wrap API route with rate limiting
 *
 * Usage:
 * ```typescript
 * export const POST = withRateLimit(
 *   async (request: Request) => {
 *     // Your handler code
 *     return NextResponse.json({ success: true });
 *   },
 *   RATE_LIMITS.api
 * );
 * ```
 */
export function withRateLimit<
  T extends (request: Request, ...args: any[]) => Promise<Response>,
>(handler: T, config: RateLimitConfig): T {
  return (async (request: Request, ...args: any[]) => {
    const rateLimitResult = await rateLimit(request, config);

    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    const response = await handler(request, ...args);

    return addRateLimitHeaders(response, config, {
      remaining: rateLimitResult.remaining,
      resetTime: rateLimitResult.resetTime,
    });
  }) as T;
}

/**
 * Reset rate limit for a specific identifier (for testing)
 */
export function resetRateLimit(identifier: string, windowMs: number): void {
  const key = `${identifier}:${windowMs}`;
  delete rateLimitStore[key];
}

/**
 * Clear all rate limits (for testing)
 */
export function clearAllRateLimits(): void {
  for (const key in rateLimitStore) {
    delete rateLimitStore[key];
  }
}
