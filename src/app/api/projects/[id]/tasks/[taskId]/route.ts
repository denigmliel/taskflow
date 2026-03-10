// src/app/api/projects/[id]/tasks/[taskId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'

const userSelect = { id: true, name: true, email: true, role: true, avatar: true }

async function getProjectAccess(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    select: { id: true },
  })
}

export async function GET(_: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const access = await getProjectAccess(params.id, userId)
  if (!access) return NextResponse.json({ error: 'Project tidak ditemukan' }, { status: 404 })

  const task = await prisma.task.findFirst({
    where: { id: params.taskId, projectId: params.id },
    include: { assignee: { select: userSelect }, creator: { select: userSelect } },
  })
  if (!task) return NextResponse.json({ error: 'Task tidak ditemukan' }, { status: 404 })

  return NextResponse.json({ success: true, data: task })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const access = await getProjectAccess(params.id, userId)
  if (!access) return NextResponse.json({ error: 'Project tidak ditemukan' }, { status: 404 })

  const task = await prisma.task.findFirst({ where: { id: params.taskId, projectId: params.id } })
  if (!task) return NextResponse.json({ error: 'Task tidak ditemukan' }, { status: 404 })

  const body = await req.json()
  const oldStatus = task.status

  const updated = await prisma.task.update({
    where: { id: params.taskId },
    data: {
      title:       body.title?.trim()       || task.title,
      description: body.description?.trim() ?? task.description,
      status:      body.status              || task.status,
      priority:    body.priority            || task.priority,
      deadline:    body.deadline ? new Date(body.deadline) : task.deadline,
      progress:    body.progress !== undefined ? body.progress : task.progress,
      assigneeId:  body.assigneeId !== undefined ? (body.assigneeId || null) : task.assigneeId,
    },
    include: { assignee: { select: userSelect }, creator: { select: userSelect } },
  })

  if (oldStatus !== updated.status) {
    const statusLabel = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' }
    await logActivity(params.id, userId, 'task.moved',
      `${session.user.name} memindahkan "${updated.title}" ke ${statusLabel[updated.status]}`
    )
  } else {
    await logActivity(params.id, userId, 'task.updated',
      `${session.user.name} memperbarui task "${updated.title}"`
    )
  }

  return NextResponse.json({ success: true, data: updated })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const access = await getProjectAccess(params.id, userId)
  if (!access) return NextResponse.json({ error: 'Project tidak ditemukan' }, { status: 404 })

  const task = await prisma.task.findFirst({ where: { id: params.taskId, projectId: params.id } })
  if (!task) return NextResponse.json({ error: 'Task tidak ditemukan' }, { status: 404 })

  const body = await req.json()
  const oldStatus = task.status

  const updated = await prisma.task.update({
    where: { id: params.taskId },
    data: {
      ...(body.status   !== undefined && { status:   body.status }),
      ...(body.position !== undefined && { position: body.position }),
      ...(body.progress !== undefined && { progress: body.progress }),
      ...(body.status === 'DONE'      && { progress: 100 }),
    },
    include: { assignee: { select: userSelect }, creator: { select: userSelect } },
  })

  if (body.status && oldStatus !== body.status) {
    const label = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' }
    await logActivity(params.id, userId, 'task.moved',
      `${session.user.name} memindahkan "${task.title}" dari ${label[oldStatus]} ke ${label[body.status as keyof typeof label]}`
    )
  }

  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string; taskId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const access = await getProjectAccess(params.id, userId)
  if (!access) return NextResponse.json({ error: 'Project tidak ditemukan' }, { status: 404 })

  const task = await prisma.task.findFirst({ where: { id: params.taskId, projectId: params.id } })
  if (!task) return NextResponse.json({ error: 'Task tidak ditemukan' }, { status: 404 })

  await prisma.task.delete({ where: { id: params.taskId } })

  await logActivity(params.id, userId, 'task.deleted',
    `${session.user.name} menghapus task "${task.title}"`
  )

  return NextResponse.json({ success: true })
}
