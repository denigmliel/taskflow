// src/lib/activity.ts
import { Prisma } from '@prisma/client'
import { prisma } from './prisma'

export async function logActivity(
  projectId: string,
  userId: string,
  action: string,
  description: string,
  meta?: Prisma.InputJsonValue
) {
  try {
    await prisma.activityLog.create({
      data: { projectId, userId, action, description, meta },
    })
  } catch (e) {
    console.error('Activity log failed:', e)
  }
}
