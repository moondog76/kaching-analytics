// Audit Middleware Wrapper for API Routes
import { getServerSession } from 'next-auth';
import { logAuditEvent } from './audit';
import { NextRequest, NextResponse } from 'next/server';

type ApiHandler = (request: NextRequest, context?: any) => Promise<NextResponse>;

export function withAudit(
  handler: ApiHandler,
  resourceName: string
): ApiHandler {
  return async (request: NextRequest, context?: any) => {
    const startTime = Date.now();
    
    try {
      // Get session for user info
      const session = await getServerSession();
      const userId = (session?.user as any)?.id || 'anonymous';
      const merchantId = (session?.user as any)?.merchant || 'unknown';
      
      // Execute the handler
      const response = await handler(request, context);
      
      // Log successful access
      const duration = Date.now() - startTime;
      await logAuditEvent(
        userId,
        merchantId,
        resourceName,
        request.method,
        {
          status: response.status,
          duration_ms: duration,
          path: request.nextUrl.pathname
        }
      ).catch(console.error); // Don't fail request if audit fails
      
      return response;
    } catch (error) {
      // Log failed access
      const duration = Date.now() - startTime;
      const session = await getServerSession().catch(() => null);
      const userId = (session?.user as any)?.id || 'anonymous';
      const merchantId = (session?.user as any)?.merchant || 'unknown';
      
      await logAuditEvent(
        userId,
        merchantId,
        resourceName,
        request.method,
        {
          status: 500,
          duration_ms: duration,
          error: (error as Error).message,
          path: request.nextUrl.pathname
        }
      ).catch(console.error);
      
      throw error;
    }
  };
}
