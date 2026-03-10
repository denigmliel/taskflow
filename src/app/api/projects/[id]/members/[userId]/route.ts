// src/app/api/projects/[id]/members/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'

export async function DELETE(_: NextRequest, { params }: { params: { id: string; userId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const actorId = (session.user as any).id

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: { id: true, ownerId: true },
  })
  if (!project) return NextResponse.json({ error: 'Project tidak ditemukan' }, { status: 404 })
  if (project.ownerId !== actorId) {
    return NextResponse.json({ error: 'Hanya pemilik project yang dapat menghapus anggota' }, { status: 403 })
  }
  if (project.ownerId === params.userId) return NextResponse.json({ error: 'Tidak bisa menghapus pemilik project' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: params.userId }, select: { name: true } })

  try {
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: params.id, userId: params.userId } },
    })
  } catch {
    return NextResponse.json({ error: 'Anggota tidak ditemukan pada project ini' }, { status: 404 })
  }

  await logActivity(params.id, actorId, 'member.removed',
    `${session.user.name} menghapus ${user?.name} dari project`
  )

  return NextResponse.json({ success: true })
}
