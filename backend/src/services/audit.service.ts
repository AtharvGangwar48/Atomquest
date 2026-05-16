import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function writeAudit(
  entityType: string,
  entityId: string,
  changedBy: string,
  oldValue: object | null,
  newValue: object | null,
  action: 'CREATE' | 'UPDATE' | 'DELETE' = 'UPDATE'
) {
  await prisma.auditLog.create({
    data: {
      entityType,
      entityId,
      action,
      changedBy,
      oldValue: oldValue ?? undefined,
      newValue: newValue ?? undefined,
    },
  });
}
