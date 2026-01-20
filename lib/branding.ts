import { prisma } from './db'

export interface MerchantBranding {
  name: string
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  customDomain?: string
}

// Default platform branding
export const DEFAULT_BRANDING: MerchantBranding = {
  name: 'KaChing Analytics',
  logoUrl: undefined,
  primaryColor: '#FF6B35',
  secondaryColor: '#7B61FF',
  customDomain: undefined
}

/**
 * Get branding for a merchant
 */
export async function getMerchantBranding(merchantId: string): Promise<MerchantBranding> {
  try {
    const merchant = await prisma.merchants.findUnique({
      where: { id: merchantId },
      select: {
        name: true,
        logo_url: true,
        primary_color: true,
        secondary_color: true,
        custom_domain: true
      }
    })

    if (!merchant) return DEFAULT_BRANDING

    return {
      name: merchant.name,
      logoUrl: merchant.logo_url || undefined,
      primaryColor: merchant.primary_color || DEFAULT_BRANDING.primaryColor,
      secondaryColor: merchant.secondary_color || DEFAULT_BRANDING.secondaryColor,
      customDomain: merchant.custom_domain || undefined
    }
  } catch (error) {
    console.error('Error fetching branding:', error)
    return DEFAULT_BRANDING
  }
}

/**
 * Update merchant branding
 */
export async function updateMerchantBranding(
  merchantId: string,
  branding: Partial<MerchantBranding>
): Promise<boolean> {
  try {
    await prisma.merchants.update({
      where: { id: merchantId },
      data: {
        logo_url: branding.logoUrl,
        primary_color: branding.primaryColor,
        secondary_color: branding.secondaryColor,
        custom_domain: branding.customDomain
      }
    })
    return true
  } catch (error) {
    console.error('Error updating branding:', error)
    return false
  }
}

/**
 * Generate CSS variables from branding
 */
export function brandingToCssVars(branding: MerchantBranding): Record<string, string> {
  return {
    '--brand-primary': branding.primaryColor,
    '--brand-secondary': branding.secondaryColor,
    '--brand-primary-rgb': hexToRgb(branding.primaryColor),
    '--brand-secondary-rgb': hexToRgb(branding.secondaryColor),
  }
}

/**
 * Convert hex color to RGB string
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '255, 107, 53'
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
}
