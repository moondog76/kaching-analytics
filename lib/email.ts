/**
 * Email service abstraction
 * Supports Resend API and Console mode (for development)
 *
 * For production, use Resend (https://resend.com) - free tier: 3000 emails/month
 */

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType: string
  }>
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send email using configured provider
 * Environment variables:
 * - EMAIL_PROVIDER: 'resend' | 'console' (default: 'console')
 * - RESEND_API_KEY, RESEND_FROM (required for 'resend' provider)
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const provider = process.env.EMAIL_PROVIDER || 'console'

  switch (provider) {
    case 'resend':
      return sendResendEmail(options)
    case 'console':
    default:
      return sendConsoleEmail(options)
  }
}

/**
 * Console email (for development/testing)
 */
async function sendConsoleEmail(options: EmailOptions): Promise<EmailResult> {
  console.log('=== Email (Console Mode) ===')
  console.log('To:', Array.isArray(options.to) ? options.to.join(', ') : options.to)
  console.log('Subject:', options.subject)
  console.log('HTML Length:', options.html.length, 'characters')
  if (options.attachments) {
    console.log('Attachments:', options.attachments.map(a => a.filename).join(', '))
  }
  console.log('============================')

  return {
    success: true,
    messageId: `console-${Date.now()}`
  }
}

/**
 * Resend email (https://resend.com)
 * Free tier: 3,000 emails/month, 100 emails/day
 */
async function sendResendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.error('RESEND_API_KEY not configured, falling back to console')
      return sendConsoleEmail(options)
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'KaChing Analytics <noreply@kaching.com>',
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: typeof att.content === 'string' ? att.content : att.content.toString('base64')
        }))
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Resend API error')
    }

    const result = await response.json()
    return {
      success: true,
      messageId: result.id
    }
  } catch (error) {
    console.error('Resend email error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Resend send failed'
    }
  }
}

/**
 * Send a test email to verify configuration
 */
export async function sendTestEmail(to: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: 'KaChing Analytics - Test Email',
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Test Email</h2>
        <p>This is a test email from KaChing Analytics.</p>
        <p>If you received this, your email configuration is working correctly.</p>
        <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
      </div>
    `
  })
}
