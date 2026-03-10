// src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id

  const projectWhere = {
    OR: [{ ownerId: userId }, { members: { some: { userId } } }],
  }

  // Fetch project ids and recent projects in parallel.
  const [userProjects, recentProjectsRaw] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      select: { id: true },
    }),
    prisma.project.findMany({
      where: projectWhere,
      select: {
        id: true,
        name: true,
        color: true,
        _count: { select: { tasks: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    }),
  ])

  const projectIds = userProjects.map(p => p.id)
  if (projectIds.length === 0) {
    return NextResponse.json({
      success: true,
      data: {
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
        myTasks: [],
        recentProjects: [],
        tasksByStatus: [],
        tasksByPriority: [],
      },
    })
  }

  const now = new Date()
  const recentProjectIds = recentProjectsRaw.map((project) => project.id)

  const [statusTotals, overdueTasks, tasksByPriorityRaw, myTasks, recentDoneRaw] = await Promise.all([
    prisma.task.groupBy({
      by: ['status'],
      where: { projectId: { in: projectIds } },
      _count: { _all: true },
    }),
    prisma.task.count({
      where: { projectId: { in: projectIds }, status: { not: 'DONE' }, deadline: { lt: now } },
    }),
    prisma.task.groupBy({
      by: ['priority'],
      where: { projectId: { in: projectIds }, status: { not: 'DONE' } },
      _count: { _all: true },
    }),
    prisma.task.findMany({
      where: { projectId: { in: projectIds }, assigneeId: userId, status: { not: 'DONE' } },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        deadline: true,
        progress: true,
        assigneeId: true,
        creatorId: true,
        projectId: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: [{ deadline: 'asc' }, { priority: 'desc' }],
      take: 8,
    }),
    recentProjectIds.length > 0
      ? prisma.task.groupBy({
          by: ['projectId'],
          where: { projectId: { in: recentProjectIds }, status: 'DONE' },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ])

  const statusCountByKey = {
    TODO: 0,
    IN_PROGRESS: 0,
    DONE: 0,
  }
  for (const row of statusTotals) {
    statusCountByKey[row.status] = row._count._all
  }

  const totalTasks = statusCountByKey.TODO + statusCountByKey.IN_PROGRESS + statusCountByKey.DONE
  const doneTasks = statusCountByKey.DONE
  const inProgressTasks = statusCountByKey.IN_PROGRESS

  const doneByProject = new Map<string, number>()
  for (const row of recentDoneRaw) {
    doneByProject.set(row.projectId, row._count._all)
  }

  const recentProjects = recentProjectsRaw.map((project) => {
    const done = doneByProject.get(project.id) || 0
    return {
      id: project.id,
      name: project.name,
      color: project.color,
      taskStats: {
        total: project._count.tasks,
        done,
      },
    }
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
      tasksByStatus: statusTotals.map(s => ({
        name:  statusLabels[s.status as keyof typeof statusLabels],
        value: s._count._all,
        color: statusColors[s.status as keyof typeof statusColors],
      })),
      tasksByPriority: tasksByPriorityRaw.map(p => ({
        name:  priorityLabels[p.priority as keyof typeof priorityLabels],
        value: p._count._all,
        color: priorityColors[p.priority as keyof typeof priorityColors],
      })),
    },
  })
}
