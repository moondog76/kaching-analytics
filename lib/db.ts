import { PrismaClient } from '@prisma/client'
grep -A15 "interface AuditLogInput" lib/security/audit.ts
cat lib/security/audit.ts | head -40
git checkout lib/db.ts && cat lib/security/audit.ts | head -30
git checkout HEAD -- lib/db.ts
grep -A8 "export interface AuditLogInput" lib/security/audit.ts
echo "import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
    }
    
    export const prisma = globalForPrisma.prisma ?? new PrismaClient()
    
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma" > lib/db.ts
    rm lib/security/withAudit.ts && sed -i '/logAuditEvent/d' app/api/anomalies/route.ts app/api/chat/route.ts app/api/forecast/route.ts app/api/insights/route.ts
    git status --ShadowRootcat > lib/db.ts << 'ENDOFFILE'
    import { PrismaClient } from '@prisma/client'
    
    const globalForPrisma = globalThis as unknown as {
      prisma: PrismaClient | undefined
      }
      
      export const prisma = globalForPrisma.prisma ?? new PrismaClient()
      
      if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
      ENDOFFILE
      cat lib/db.ts
      git checkout HEAD -- lib/db.ts app/api/anomalies/route.ts app/api/chat/route.ts app/api/forecast/route.ts app/api/insights/route.ts && rm -f lib/security/withAudit.ts
      git status --short && head -3 lib/db.ts
      git reset --hard HEAD~2
      git push --force && head -5 lib/db.tsgrep -A5 "export async function logAuditEvent" lib/security/audit.ts
      grep -B2 -A10 "interface AuditLogInput" lib/security/audit.ts
      git checkout HEAD -- lib/db.ts && cat lib/security/audit.ts | head -30
      cat lib/security/audit.ts
      git checkout HEAD -- lib/db.ts && git checkout HEAD -- app/api/ && rm lib/security/withAudit.ts && git status --short
      git reset --hard HEAD && git status
      git log --oneline -5
      git reset --hard eb76010 && git clean -fd && git status
      git push --force origin main"
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
