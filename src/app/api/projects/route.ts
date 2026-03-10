// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'

const userSelect = { id: true, name: true, email: true, role: true, avatar: true }

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const projects = await prisma.project.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    include: {
      owner:   { select: userSelect },
      members: { include: { user: { select: userSelect } } },
      _count:  { select: { tasks: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  if (projects.length === 0) {
    return NextResponse.json({ success: true, data: [] })
  }

  // Aggregate task stats in batch to avoid N+1 queries.
  const projectIds = projects.map((project) => project.id)
  const now = new Date()
  const [statusCounts, overdueCounts] = await Promise.all([
    prisma.task.groupBy({
      by: ['projectId', 'status'],
      where: { projectId: { in: projectIds } },
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ['projectId'],
      where: {
        projectId: { in: projectIds },
        status: { not: 'DONE' },
        deadline: { lt: now },
      },
      _count: { _all: true },
    }),
  ])

  const statsMap = new Map<string, { todo: number; inProgress: number; done: number; overdue: number }>()
  for (const project of projects) {
    statsMap.set(project.id, { todo: 0, inProgress: 0, done: 0, overdue: 0 })
  }

  for (const row of statusCounts) {
    const stats = statsMap.get(row.projectId)
    if (!stats) continue
    if (row.status === 'TODO') stats.todo = row._count._all
    if (row.status === 'IN_PROGRESS') stats.inProgress = row._count._all
    if (row.status === 'DONE') stats.done = row._count._all
  }

  for (const row of overdueCounts) {
    const stats = statsMap.get(row.projectId)
    if (!stats) continue
    stats.overdue = row._count._all
  }

  const withStats = projects.map((project) => {
    const stats = statsMap.get(project.id) || { todo: 0, inProgress: 0, done: 0, overdue: 0 }
    return {
      ...project,
      taskStats: {
        total: project._count.tasks,
        ...stats,
      },
    }
  })

  return NextResponse.json({ success: true, data: withStats })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const body = await req.json()
  const { name, description, color, startDate, endDate } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Nama project wajib diisi' }, { status: 400 })

  const project = await prisma.project.create({
    data: {
      name:       name.trim(),
      description: description?.trim(),
      color:      color || '#6366f1',
      startDate:  startDate ? new Date(startDate) : null,
      endDate:    endDate   ? new Date(endDate)   : null,
      ownerId:    userId,
      members:    { create: { userId } },
    },
    include: {
      owner:   { select: userSelect },
      members: { include: { user: { select: userSelect } } },
      _count:  { select: { tasks: true } },
    },
  })

  await logActivity(project.id, userId, 'project.created',
    `${session.user.name} membuat project "${project.name}"`
  )

  return NextResponse.json({ success: true, data: project }, { status: 201 })
}
