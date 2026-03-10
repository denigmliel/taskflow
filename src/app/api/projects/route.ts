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

  // Attach task stats
  const now = new Date()
  const withStats = await Promise.all(projects.map(async p => {
    const [todo, inProgress, done, overdue] = await Promise.all([
      prisma.task.count({ where: { projectId: p.id, status: 'TODO' } }),
      prisma.task.count({ where: { projectId: p.id, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { projectId: p.id, status: 'DONE' } }),
      prisma.task.count({ where: { projectId: p.id, status: { not: 'DONE' }, deadline: { lt: now } } }),
    ])
    return { ...p, taskStats: { total: p._count.tasks, todo, inProgress, done, overdue } }
  }))

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
