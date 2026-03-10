// src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id

  // Projects user is part of
  const userProjects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    select: { id: true },
  })
  const projectIds = userProjects.map(p => p.id)

  const now = new Date()

  const [totalTasks, doneTasks, inProgressTasks, overdueTasks] = await Promise.all([
    prisma.task.count({ where: { projectId: { in: projectIds } } }),
    prisma.task.count({ where: { projectId: { in: projectIds }, status: 'DONE' } }),
    prisma.task.count({ where: { projectId: { in: projectIds }, status: 'IN_PROGRESS' } }),
    prisma.task.count({ where: { projectId: { in: projectIds }, status: { not: 'DONE' }, deadline: { lt: now } } }),
  ])

  const myTasks = await prisma.task.findMany({
    where: { projectId: { in: projectIds }, assigneeId: userId, status: { not: 'DONE' } },
    include: { assignee: { select: { id: true, name: true, email: true, role: true, avatar: true } }, creator: { select: { id: true, name: true, email: true, role: true, avatar: true } }, project: true },
    orderBy: [{ deadline: 'asc' }, { priority: 'desc' }],
    take: 8,
  })

  const recentProjects = await prisma.project.findMany({
    where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
    include: {
      owner: { select: { id: true, name: true, email: true, role: true, avatar: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, role: true, avatar: true } } } },
      _count: { select: { tasks: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 6,
  })

  // Task distribution
  const tasksByStatusRaw = await prisma.task.groupBy({
    by: ['status'],
    where: { projectId: { in: projectIds } },
    _count: true,
  })

  const tasksByPriorityRaw = await prisma.task.groupBy({
    by: ['priority'],
    where: { projectId: { in: projectIds }, status: { not: 'DONE' } },
    _count: true,
  })

  const statusColors = { TODO: '#64748b', IN_PROGRESS: '#3b82f6', DONE: '#22c55e' }
  const priorityColors = { HIGH: '#f43f5e', MEDIUM: '#f59e0b', LOW: '#22c55e' }
  const statusLabels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' }
  const priorityLabels = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' }

  return NextResponse.json({
    success: true,
    data: {
      totalProjects:   projectIds.length,
      totalTasks,
      completedTasks:  doneTasks,
      inProgressTasks,
      overdueTasks,
      completionRate:  totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      myTasks,
      recentProjects,
      tasksByStatus: tasksByStatusRaw.map(s => ({
        name:  statusLabels[s.status as keyof typeof statusLabels],
        value: s._count,
        color: statusColors[s.status as keyof typeof statusColors],
      })),
      tasksByPriority: tasksByPriorityRaw.map(p => ({
        name:  priorityLabels[p.priority as keyof typeof priorityLabels],
        value: p._count,
        color: priorityColors[p.priority as keyof typeof priorityColors],
      })),
    },
  })
}
