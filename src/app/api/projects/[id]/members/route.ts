// src/app/api/projects/[id]/members/route.ts
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

async function getOwnedProject(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
    select: { id: true },
  })
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const access = await getProjectAccess(params.id, userId)
  if (!access) return NextResponse.json({ error: 'Project tidak ditemukan' }, { status: 404 })

  const members = await prisma.projectMember.findMany({
    where: { projectId: params.id },
    include: {
      user: {
        select: {
          ...userSelect,
          assignedTasks: {
            where: { projectId: params.id },
            select: { id: true, status: true },
          },
        },
      },
    },
    orderBy: { joinedAt: 'asc' },
  })

  return NextResponse.json({ success: true, data: members })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const project = await getOwnedProject(params.id, userId)
  if (!project) return NextResponse.json({ error: 'Hanya pemilik project yang dapat menambah anggota' }, { status: 403 })

  const { email } = await req.json()
  if (!email?.trim()) return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: userSelect,
  })
  if (!user) return NextResponse.json({ error: 'User dengan email ini tidak ditemukan' }, { status: 404 })

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: params.id, userId: user.id } },
  })
  if (existing) return NextResponse.json({ error: 'User sudah menjadi anggota project ini' }, { status: 409 })

  await prisma.projectMember.create({ data: { projectId: params.id, userId: user.id } })

  await logActivity(params.id, userId, 'member.added',
    `${session.user.name} menambahkan ${user.name} ke project`
  )

  return NextResponse.json({ success: true, data: user }, { status: 201 })
}
