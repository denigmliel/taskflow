// src/app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'

const userSelect = { id: true, name: true, email: true, role: true, avatar: true }

async function getProject(id: string, userId: string) {
  return prisma.project.findFirst({
    where: {
      id,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    include: {
      owner:   { select: userSelect },
      members: { include: { user: { select: userSelect } } },
      _count:  { select: { tasks: true } },
    },
  })
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const project = await getProject(params.id, userId)
  if (!project) return NextResponse.json({ error: 'Project tidak ditemukan' }, { status: 404 })

  const now = new Date()
  const [todo, inProgress, done, overdue] = await Promise.all([
    prisma.task.count({ where: { projectId: project.id, status: 'TODO' } }),
    prisma.task.count({ where: { projectId: project.id, status: 'IN_PROGRESS' } }),
    prisma.task.count({ where: { projectId: project.id, status: 'DONE' } }),
    prisma.task.count({ where: { projectId: project.id, status: { not: 'DONE' }, deadline: { lt: now } } }),
  ])

  return NextResponse.json({
    success: true,
    data: { ...project, taskStats: { total: project._count.tasks, todo, inProgress, done, overdue } },
  })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const project = await getProject(params.id, userId)
  if (!project) return NextResponse.json({ error: 'Project tidak ditemukan' }, { status: 404 })

  const body = await req.json()
  const data: any = {}

  if (typeof body.name === 'string') {
    const trimmedName = body.name.trim()
    if (!trimmedName) return NextResponse.json({ error: 'Nama project wajib diisi' }, { status: 400 })
    data.name = trimmedName
  }

  if ('description' in body) {
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    data.description = description || null
  }

  if (typeof body.color === 'string' && body.color.trim()) {
    data.color = body.color.trim()
  }

  if (typeof body.status === 'string') {
    data.status = body.status
  }

  if ('startDate' in body) {
    data.startDate = body.startDate ? new Date(body.startDate) : null
  }

  if ('endDate' in body) {
    data.endDate = body.endDate ? new Date(body.endDate) : null
  }

  const updated = await prisma.project.update({
    where: { id: params.id },
    data,
    include: {
      owner:   { select: userSelect },
      members: { include: { user: { select: userSelect } } },
      _count:  { select: { tasks: true } },
    },
  })

  await logActivity(params.id, userId, 'project.updated',
    `${session.user.name} memperbarui project "${updated.name}"`
  )

  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const project = await getProject(params.id, userId)
  if (!project) return NextResponse.json({ error: 'Project tidak ditemukan' }, { status: 404 })

  await prisma.project.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
