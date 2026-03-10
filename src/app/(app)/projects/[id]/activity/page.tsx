'use client'
// src/app/(app)/projects/[id]/activity/page.tsx
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { FolderPlus, CheckSquare2, ArrowRight, UserPlus, UserMinus, Pencil, Loader2 } from 'lucide-react'
import { formatRelative, getInitials, getAvatarGradient } from '@/lib/utils'
import { ActivityWithUser } from '@/types'

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  'project.created':  { icon: FolderPlus,    color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  'project.updated':  { icon: Pencil,        color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  'task.created':     { icon: CheckSquare2,  color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  'task.updated':     { icon: Pencil,        color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  'task.moved':       { icon: ArrowRight,    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  'task.completed':   { icon: CheckSquare2,  color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  'task.deleted':     { icon: UserMinus,     color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
  'member.added':     { icon: UserPlus,      color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
  'member.removed':   { icon: UserMinus,     color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
}

export default function ActivityPage() {
  const { id: projectId } = useParams() as { id: string }
  const [activities, setActivities] = useState<ActivityWithUser[]>([])
  const [loading, setLoading]       = useState(true)
  const [page, setPage]             = useState(1)
  const [hasMore, setHasMore]       = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  async function load(p: number) {
    if (p === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/activities?page=${p}`)
      const data = await res.json()
      if (data.success) {
        if (p === 1) setActivities(data.data)
        else setActivities(prev => [...prev, ...data.data])
        setHasMore(data.meta.page < data.meta.totalPages)
        setPage(p)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => { load(1) }, [projectId])

  return (
    <div className="p-6 max-w-2xl mx-auto animate-in">
      <div className="mb-6">
        <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#e8e8f0' }}>Riwayat Aktivitas</h2>
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>Semua perubahan dalam project ini</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-14 skeleton" />)}
        </div>
      ) : activities.length === 0 ? (
        <div className="empty-state card">
          <p className="text-sm">Belum ada aktivitas</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline */}
          <div className="absolute left-5 top-5 bottom-5 w-px" style={{ background: 'var(--border)' }} />

          <div className="space-y-2">
            {activities.map((activity, i) => {
              const conf = ACTION_CONFIG[activity.action] || { icon: Pencil, color: '#64748b', bg: 'rgba(100,116,139,0.1)' }
              const Icon = conf.icon

              return (
                <div key={activity.id} className="flex gap-4 items-start animate-in" style={{ animationDelay: `${i * 0.02}s` }}>
                  {/* Icon */}
                  <div className="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: conf.bg, border: `1px solid ${conf.color}25` }}>
                    <Icon size={15} style={{ color: conf.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 py-2.5 border-b min-w-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <div className="flex items-start gap-2">
                      <div className={`avatar w-5 h-5 text-[8px] font-bold bg-gradient-to-br ${getAvatarGradient(activity.userId)} text-white flex-shrink-0 mt-0.5`}>
                        {getInitials(activity.user.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm" style={{ color: 'var(--text-2)' }}>{activity.description}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                          {formatRelative(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-5">
              <button onClick={() => load(page + 1)} disabled={loadingMore}
                className="btn btn-ghost btn-sm">
                {loadingMore ? <Loader2 size={14} className="animate-spin" /> : 'Muat lebih banyak'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
