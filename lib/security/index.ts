/**
 * Security utilities for KaChing Analytics
 * Centralized security functions for consistent handling
 */

import { NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

/**
 * Standard error response - never expose internal details
 */
export function secureErrorResponse(
  message: string = 'An error occurred',
  status: number = 500
): NextResponse {
  return NextResponse.json(
    { error: message },
    { status }
  )
}

/**
 * Standard unauthorized response
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  )
}

/**
 * Standard forbidden response
 */
export function forbiddenResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Forbidden' },
    { status: 403 }
  )
}

/**
 * Sanitize string for use in filenames
 */
export function sanitizeFilename(name: string, maxLength: number = 50): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/-+/g, '-')            // Collapse multiple hyphens
    .substring(0, maxLength)
}

/**
 * Sanitize HTML to prevent XSS in email templates
 */
export function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  }
  return text.replace(/[&<>"'`=/]/g, char => htmlEntities[char])
}

/**
 * Validate numeric input with bounds
 */
export function parseIntSafe(
  value: string | null,
  defaultValue: number,
  min?: number,
  max?: number
): number {
  if (!value) return defaultValue

  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) return defaultValue

  let result = parsed
  if (min !== undefined) result = Math.max(result, min)
  if (max !== undefined) result = Math.min(result, max)

  return result
}

/**
 * Validate float input with bounds
 */
export function parseFloatSafe(
  value: string | null,
  defaultValue: number,
  min?: number,
  max?: number
): number {
  if (!value) return defaultValue

  const parsed = parseFloat(value)
  if (isNaN(parsed)) return defaultValue

  let result = parsed
  if (min !== undefined) result = Math.max(result, min)
  if (max !== undefined) result = Math.min(result, max)

  return result
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

/**
 * Hash a value using SHA-256
 */
export function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length)
  }
  return data.substring(0, visibleChars) + '*'.repeat(data.length - visibleChars * 2) + data.substring(data.length - visibleChars)
}

/**
 * Rate limiting constants
 */
export const RATE_LIMITS = {
  standard: { maxRequests: 60, windowMs: 60000 },    // 60 per minute
  auth: { maxRequests: 5, windowMs: 60000 },         // 5 per minute (reduced for security)
  ai: { maxRequests: 20, windowMs: 60000 },          // 20 per minute
  import: { maxRequests: 3, windowMs: 300000 },      // 3 per 5 minutes
  export: { maxRequests: 10, windowMs: 60000 },      // 10 per minute
  email: { maxRequests: 10, windowMs: 3600000 },     // 10 per hour
} as const

/**
 * Validate search input
 */
export function validateSearchInput(
  search: string | null,
  minLength: number = 2,
  maxLength: number = 100
): { valid: boolean; sanitized?: string; error?: string } {
  if (!search) return { valid: true }

  const trimmed = search.trim()

  if (trimmed.length < minLength) {
    return { valid: false, error: `Search must be at least ${minLength} characters` }
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Search must be at most ${maxLength} characters` }
  }

  // Remove potentially dangerous characters
  const sanitized = trimmed.replace(/[<>{}[\]\\]/g, '')

  return { valid: true, sanitized }
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Log security event (safe for production)
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, any> = {}
): void {
  // Mask sensitive fields
  const safeDetails = { ...details }
  if (safeDetails.email) safeDetails.email = maskSensitiveData(safeDetails.email)
  if (safeDetails.apiKey) safeDetails.apiKey = maskSensitiveData(safeDetails.apiKey)
  if (safeDetails.password) safeDetails.password = '[REDACTED]'

  console.log(`[SECURITY] ${event}`, JSON.stringify(safeDetails))
}
