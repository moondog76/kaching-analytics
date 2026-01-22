/**
 * Access Tier Logic for KaChing Analytics Pro
 * Handles Standard (Cashback) vs Premium (Retail) access
 */

export type AccessTier = 'standard' | 'premium'
export type InsightTab = 'cashback' | 'retail'

export interface MerchantAccess {
  tier: AccessTier
  hasCashbackAccess: boolean
  hasRetailInsightsAccess: boolean
  availableTabs: InsightTab[]
  defaultTab: InsightTab
}

/**
 * Determine merchant access based on their tier
 */
export function getMerchantAccess(merchant: {
  access_tier?: AccessTier | null
  has_cashback_access?: boolean | null
  has_retail_insights?: boolean | null
}): MerchantAccess {
  const tier = merchant.access_tier || 'standard'
  const hasCashbackAccess = merchant.has_cashback_access ?? true
  const hasRetailInsightsAccess = merchant.has_retail_insights ?? (tier === 'premium')

  const availableTabs: InsightTab[] = []
  if (hasCashbackAccess) availableTabs.push('cashback')
  if (hasRetailInsightsAccess) availableTabs.push('retail')

  // Default to first available tab
  const defaultTab = availableTabs[0] || 'cashback'

  return {
    tier,
    hasCashbackAccess,
    hasRetailInsightsAccess,
    availableTabs,
    defaultTab
  }
}

/**
 * Check if merchant can access a specific tab
 */
export function canAccessTab(access: MerchantAccess, tab: InsightTab): boolean {
  return access.availableTabs.includes(tab)
}

/**
 * Get upgrade prompt for premium features
 */
export function getUpgradePrompt(feature: string): string {
  return `Access to ${feature} requires the Retail Insights package. Contact your account manager to upgrade.`
}

/**
 * GDPR minimum user threshold
 */
export const GDPR_MIN_USERS = 15

/**
 * Check if data point meets GDPR threshold
 */
export function meetsGDPRThreshold(userCount: number): boolean {
  return userCount >= GDPR_MIN_USERS
}

/**
 * Apply GDPR protection to data
 */
export function applyGDPRProtection<T>(
  data: T,
  userCount: number
): { data: T | null; isProtected: boolean; message?: string } {
  if (!meetsGDPRThreshold(userCount)) {
    return {
      data: null,
      isProtected: true,
      message: `Minimum ${GDPR_MIN_USERS} users required for this data point`
    }
  }
  return { data, isProtected: false }
}

/**
 * Format access tier for display
 */
export function formatAccessTier(tier: AccessTier): string {
  return tier === 'premium' ? 'Premium' : 'Standard'
}

/**
 * Get tier badge color
 */
export function getTierBadgeColor(tier: AccessTier): { bg: string; text: string } {
  return tier === 'premium'
    ? { bg: 'bg-pluxee-ultra-green', text: 'text-pluxee-deep-blue' }
    : { bg: 'bg-slate-100', text: 'text-slate-700' }
}
