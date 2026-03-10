'use client'
// src/app/(app)/dashboard/page.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  FolderKanban, CheckCircle2, Clock, AlertTriangle,
  TrendingUp, Plus, ArrowRight, Calendar, Zap,
} from 'lucide-react'
import { DashboardStats } from '@/types'
import {
  formatDate, deadlineBadge, PRIORITY_CONFIG,
  STATUS_CONFIG, getInitials, getAvatarGradient, cn,
} from '@/lib/utils'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData]     = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(r => {
      if (r.success) setData(r.data)
    }).finally(() => setLoading(false))
  }, [])

  const user = session?.user as any
  const displayName = user?.name?.trim() || user?.email?.split('@')?.[0] || 'Pengguna'

  if (loading) return (
    <div className="p-6 space-y-6">
      <div className="h-8 skeleton w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 skeleton" />)}
      </div>
    </div>
  )

  const stats = [
    { label: 'Total Projects',    value: data?.totalProjects || 0,    icon: FolderKanban,  color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  sub: `${data?.completionRate || 0}% completion` },
    { label: 'Task Selesai',      value: data?.completedTasks || 0,   icon: CheckCircle2,  color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   sub: `dari ${data?.totalTasks || 0} total task` },
    { label: 'Sedang Dikerjakan', value: data?.inProgressTasks || 0,  icon: Clock,         color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  sub: 'task aktif' },
    { label: 'Overdue',           value: data?.overdueTasks || 0,     icon: AlertTriangle, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',   sub: data?.overdueTasks ? 'perlu perhatian!' : 'semua on track ✓' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#e8e8f0' }}>
            Halo, {displayName} 👋
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
            Berikut ringkasan project hari ini.
          </p>
        </div>
        <Link href="/projects/new" className="btn btn-primary">
          <Plus size={15} />
          Project Baru
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, sub }, i) => (
          <div key={label} className={cn('card p-5 animate-up stagger-' + (i + 1))}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
              <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#e8e8f0' }}>
                {value}
              </span>
            </div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-2)' }}>{label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Bar chart - status */}
        <div className="card p-5 lg:col-span-3">
          <h3 className="font-semibold text-sm mb-5 flex items-center gap-2" style={{ color: '#e8e8f0' }}>
            <TrendingUp size={15} className="text-indigo-400" />
            Distribusi Task
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data?.tasksByStatus || []} barSize={40} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e1e32', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#e8e8f0', fontSize: '12px' }}
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {(data?.tasksByStatus || []).map((s, i) => <Cell key={i} fill={s.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart - priority */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-sm mb-5 flex items-center gap-2" style={{ color: '#e8e8f0' }}>
            <Zap size={15} className="text-amber-400" />
            Priority Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data?.tasksByPriority || []} cx="50%" cy="50%"
                innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                {(data?.tasksByPriority || []).map((p, i) => <Cell key={i} fill={p.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e1e32', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#e8e8f0', fontSize: '12px' }} />
              <Legend
                formatter={(value) => <span style={{ color: 'var(--text-2)', fontSize: '11px' }}>{value}</span>}
                iconType="circle" iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* My tasks + recent projects */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* My tasks */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: '#e8e8f0' }}>Task Diassign ke Saya</h3>
            <Link href="/projects" className="text-xs flex items-center gap-1 transition-colors" style={{ color: 'var(--text-3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#818cf8')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
              Lihat semua <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {(!data?.myTasks || data.myTasks.length === 0) && (
              <div className="empty-state py-8">
                <CheckCircle2 size={32} className="mb-2 text-emerald-500 opacity-50" />
                <p className="text-sm">Tidak ada task aktif untuk kamu</p>
              </div>
            )}
            {data?.myTasks?.map(task => {
              const dl = deadlineBadge(task.deadline?.toString(), task.status)
              const pConf = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]
              return (
                <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.025)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${pConf?.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#e8e8f0' }}>{task.title}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
                      {(task as any).project?.name}
                    </p>
                  </div>
                  {dl.label && (
                    <span className={`text-xs flex-shrink-0 flex items-center gap-1 ${dl.color}`}>
                      <Calendar size={10} />
                      {dl.label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent projects */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: '#e8e8f0' }}>Project Terbaru</h3>
            <Link href="/projects" className="text-xs flex items-center gap-1 transition-colors" style={{ color: 'var(--text-3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#818cf8')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
              Lihat semua <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {data?.recentProjects?.map(project => {
              const stats = (project as any).taskStats
              const pct = stats?.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
              return (
                <Link key={project.id} href={`/projects/${project.id}/board`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors block"
                  style={{ background: 'rgba(255,255,255,0.025)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}>
                  <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: project.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#e8e8f0' }}>{project.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="progress-track flex-1">
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-3)' }}>{pct}%</span>
                    </div>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-3)' }}>
                    {stats?.total || 0} tasks
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
