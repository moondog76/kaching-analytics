import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

export const config = {
  matcher: [
    '/',
    '/analytics',
    '/settings',
    '/admin',
    '/admin/:path*',
    '/api/chat',
    '/api/insights',
    '/api/forecast',
    '/api/anomalies',
    '/api/recommendations',
    '/api/admin/:path*',
    '/api/ai-chat/:path*',
    '/api/scheduled-reports/:path*',
    '/api/merchant-data',
    '/api/export',
    '/api/cohort',
    '/api/executive-briefing',
    '/api/notification-settings'
  ]
}
