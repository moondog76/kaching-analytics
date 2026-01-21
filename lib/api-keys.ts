import { randomBytes, createHash } from 'crypto'
import { prisma } from './db'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Generate a new API key
 * Format: ka_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 */
export function generateApiKey(): string {
  const prefix = 'ka_live_'
  const randomPart = randomBytes(24).toString('hex')
  return prefix + randomPart
}

/**
 * Hash an API key for storage comparison (we store the full key but hash for lookups)
 */
export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex')
}

/**
 * Create and assign a new API key to a merchant
 * Returns the plaintext key (shown once), stores the hash
 */
export async function createMerchantApiKey(merchantId: string): Promise<string> {
  const apiKey = generateApiKey()
  const hashedKey = hashApiKey(apiKey)

  await prisma.merchants.update({
    where: { id: merchantId },
    data: {
      api_key: hashedKey,  // Store hash, not plaintext
      api_key_created: new Date()
    }
  })

  // Return plaintext key - this is the only time it's available
  return apiKey
}

/**
 * Revoke a merchant's API key
 */
export async function revokeMerchantApiKey(merchantId: string): Promise<boolean> {
  try {
    await prisma.merchants.update({
      where: { id: merchantId },
      data: {
        api_key: null,
        api_key_created: null
      }
    })
    return true
  } catch (error) {
    console.error('Error revoking API key:', error)
    return false
  }
}

/**
 * Validate an API key and return the merchant
 * Compares hash of provided key against stored hash
 */
export async function validateApiKey(apiKey: string): Promise<{
  valid: boolean
  merchantId?: string
  merchantName?: string
  rateLimit?: number
}> {
  if (!apiKey || !apiKey.startsWith('ka_live_')) {
    return { valid: false }
  }

  try {
    // Hash the provided key for comparison
    const hashedKey = hashApiKey(apiKey)

    const merchant = await prisma.merchants.findFirst({
      where: { api_key: hashedKey },  // Compare hashes
      select: {
        id: true,
        name: true,
        api_rate_limit: true
      }
    })

    if (!merchant) {
      return { valid: false }
    }

    return {
      valid: true,
      merchantId: merchant.id,
      merchantName: merchant.name,
      rateLimit: merchant.api_rate_limit || 1000
    }
  } catch (error) {
    console.error('Error validating API key:', error)
    return { valid: false }
  }
}

/**
 * Log an API request
 */
export async function logApiRequest(
  merchantId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  request?: NextRequest
): Promise<void> {
  try {
    await prisma.api_logs.create({
      data: {
        merchant_id: merchantId,
        endpoint,
        method,
        status_code: statusCode,
        ip_address: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || null,
        user_agent: request?.headers.get('user-agent') || null
      }
    })
  } catch (error) {
    console.error('Error logging API request:', error)
  }
}

// In-memory rate limit store for API keys
const apiRateLimits = new Map<string, { count: number; resetTime: number }>()

/**
 * Check rate limit for an API key
 */
export function checkApiRateLimit(
  apiKey: string,
  maxRequests: number = 1000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const windowMs = 3600000 // 1 hour

  let record = apiRateLimits.get(apiKey)

  if (!record || record.resetTime < now) {
    record = {
      count: 0,
      resetTime: now + windowMs
    }
  }

  record.count++
  apiRateLimits.set(apiKey, record)

  const remaining = Math.max(0, maxRequests - record.count)
  const allowed = record.count <= maxRequests

  return {
    allowed,
    remaining,
    resetTime: record.resetTime
  }
}

/**
 * Middleware for API key authentication
 * API keys must be provided via Authorization header only (not query params for security)
 */
export async function withApiKeyAuth(
  request: NextRequest,
  handler: (merchantId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  // Extract API key from Authorization header only (query params are insecure)
  const authHeader = request.headers.get('authorization')

  let apiKey: string | null = null

  if (authHeader?.startsWith('Bearer ')) {
    apiKey = authHeader.substring(7)
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing API key', message: 'Provide API key via Authorization: Bearer <api_key> header' },
      { status: 401 }
    )
  }

  // Validate API key
  const validation = await validateApiKey(apiKey)

  if (!validation.valid || !validation.merchantId) {
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 401 }
    )
  }

  // Check rate limit
  const rateLimit = checkApiRateLimit(apiKey, validation.rateLimit)

  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000) },
      { status: 429 }
    )
    response.headers.set('X-RateLimit-Remaining', '0')
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetTime / 1000)))
    return response
  }

  // Call handler
  const response = await handler(validation.merchantId)

  // Add rate limit headers
  response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining))
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetTime / 1000)))

  // Log the request
  logApiRequest(
    validation.merchantId,
    request.nextUrl.pathname,
    request.method,
    response.status,
    request
  ).catch(() => {})

  return response
}
