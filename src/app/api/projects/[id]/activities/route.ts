// src/app/api/projects/[id]/activities/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const access = await prisma.project.findFirst({
    where: {
      id: params.id,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    select: { id: true },
  })
  if (!access) return NextResponse.json({ error: 'Project tidak ditemukan' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const page  = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const skip  = (page - 1) * limit

  const [activities, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: { projectId: params.id },
      include: { user: { select: { id: true, name: true, email: true, role: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where: { projectId: params.id } }),
  ])

  return NextResponse.json({
    success: true,
    data: activities,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}
