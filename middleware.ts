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
    '/api/chat',
    '/api/insights',
    '/api/forecast',
    '/api/anomalies',
    '/api/recommendations'
  ]
}
