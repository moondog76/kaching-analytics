import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  maxRequests: number  // Max requests per window
  windowMs: number     // Time window in milliseconds
}

// In-memory store (for single-instance deployments)
// For production with multiple instances, use Redis
const requestCounts = new Map<string, { count: number; resetTime: number }>()

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of requestCounts.entries()) {
    if (value.resetTime < now) {
      requestCounts.delete(key)
    }
  }
}, 60000) // Clean every minute

/**
 * Get client identifier from request
 */
function getClientId(request: NextRequest): string {
  // Try to get real IP from proxy headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'

  // Include path in key for per-endpoint limiting
  const path = new URL(request.url).pathname

  return `${ip}:${path}`
}

/**
 * Check if request should be rate limited
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = { maxRequests: 60, windowMs: 60000 }
): { allowed: boolean; remaining: number; resetTime: number } {
  const clientId = getClientId(request)
  const now = Date.now()

  let record = requestCounts.get(clientId)

  // Create new record if doesn't exist or window has passed
  if (!record || record.resetTime < now) {
    record = {
      count: 0,
      resetTime: now + config.windowMs
    }
  }

  record.count++
  requestCounts.set(clientId, record)

  const remaining = Math.max(0, config.maxRequests - record.count)
  const allowed = record.count <= config.maxRequests

  return {
    allowed,
    remaining,
    resetTime: record.resetTime
  }
}

/**
 * Rate limit middleware wrapper
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config?: RateLimitConfig
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { allowed, remaining, resetTime } = checkRateLimit(request, config)

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: Math.ceil((resetTime - Date.now()) / 1000) },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
            'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000))
          }
        }
      )
    }

    const response = await handler(request)

    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)))

    return response
  }
}

// Preset configurations
export const RATE_LIMITS = {
  // Standard API endpoints
  standard: { maxRequests: 60, windowMs: 60000 },    // 60/min
  // Auth endpoints (stricter)
  auth: { maxRequests: 10, windowMs: 60000 },        // 10/min
  // AI endpoints (expensive operations)
  ai: { maxRequests: 20, windowMs: 60000 },          // 20/min
  // Import endpoints (heavy operations)
  import: { maxRequests: 5, windowMs: 300000 },      // 5 per 5 min
}
