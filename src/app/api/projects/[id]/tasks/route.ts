// src/app/api/projects/[id]/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'
import { TaskStatus } from '@prisma/client'

const userSelect = { id: true, name: true, avatar: true }

async function getProjectAccess(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    select: { id: true },
  })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const access = await getProjectAccess(params.id, userId)
  if (!access) return NextResponse.json({ error: 'Project tidak ditemukan' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const status     = searchParams.get('status') as TaskStatus | null
  const priority   = searchParams.get('priority')
  const assigneeId = searchParams.get('assigneeId')
  const search     = searchParams.get('search')

  const tasks = await prisma.task.findMany({
    where: {
      projectId: params.id,
      ...(status     && { status: status as TaskStatus }),
      ...(priority   && { priority: priority as any }),
      ...(assigneeId && { assigneeId }),
      ...(search     && { title: { contains: search, mode: 'insensitive' } }),
    },
    include: {
      assignee: { select: userSelect },
      creator:  { select: userSelect },
    },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
  })

  // Group tasks for board response in one pass.
  const board: Record<TaskStatus, typeof tasks> = {
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  }
  for (const task of tasks) board[task.status].push(task)

  return NextResponse.json({ success: true, data: { board } })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const access = await getProjectAccess(params.id, userId)
  if (!access) return NextResponse.json({ error: 'Project tidak ditemukan' }, { status: 404 })

  const body = await req.json()
  if (!body.title?.trim()) return NextResponse.json({ error: 'Judul task wajib diisi' }, { status: 400 })

  const maxPos = await prisma.task.aggregate({
    where: { projectId: params.id, status: body.status || 'TODO' },
    _max: { position: true },
  })

  const task = await prisma.task.create({
    data: {
      title:       body.title.trim(),
      description: body.description?.trim(),
      status:      body.status    || 'TODO',
      priority:    body.priority  || 'MEDIUM',
      deadline:    body.deadline  ? new Date(body.deadline) : null,
      progress:    body.progress  || 0,
      position:    (maxPos._max.position ?? 0) + 1,
      projectId:   params.id,
      assigneeId:  body.assigneeId || null,
      creatorId:   userId,
    },
    include: {
      assignee: { select: userSelect },
      creator:  { select: userSelect },
    },
  })

  await logActivity(params.id, userId, 'task.created',
    `${session.user.name} membuat task "${task.title}"`
  )

  return NextResponse.json({ success: true, data: task }, { status: 201 })
}
