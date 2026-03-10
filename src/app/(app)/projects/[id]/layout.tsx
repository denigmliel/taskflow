'use client'
// src/app/(app)/projects/[id]/layout.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { ArrowLeft, Kanban, Users, Clock } from 'lucide-react'
import { ProjectWithRelations } from '@/types'
import { formatDate, cn } from '@/lib/utils'

const tabs = [
  { key: 'board',    label: 'Board',     icon: Kanban },
  { key: 'team',     label: 'Tim',       icon: Users  },
  { key: 'activity', label: 'Aktivitas', icon: Clock  },
]

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params    = useParams()
  const pathname  = usePathname()
  const projectId = params.id as string
  const [project, setProject] = useState<ProjectWithRelations | null>(null)

  useEffect(() => {
    fetch(`/api/projects/${projectId}`).then(r => r.json()).then(r => {
      if (r.success) setProject(r.data)
    })
  }, [projectId])

  const activeTab = tabs.find(t => pathname.endsWith(t.key))?.key || 'board'

  return (
    <div className="flex flex-col h-[calc(100dvh-0px)] overflow-hidden">
      {/* Project header */}
      <div className="px-6 pt-5 pb-0 border-b flex-shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--panel)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Link href="/projects" className="btn btn-icon btn-ghost flex-shrink-0">
            <ArrowLeft size={16} />
          </Link>
          {project ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: project.color }} />
              <div className="min-w-0">
                <h1 className="font-semibold text-base truncate" style={{ color: '#e8e8f0' }}>{project.name}</h1>
                {project.endDate && (
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                    Deadline: {formatDate(project.endDate)}
                  </p>
                )}
              </div>
              {project.taskStats && (
                <div className="hidden sm:flex items-center gap-3 ml-4">
                  {[
                    { label: 'Total', val: project.taskStats.total },
                    { label: 'Selesai', val: project.taskStats.done },
                    { label: 'Overdue', val: project.taskStats.overdue },
                  ].map(s => (
                    <div key={s.label} className="text-center px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="text-sm font-bold" style={{ color: '#e8e8f0' }}>{s.val}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-3)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-5 skeleton w-40" />
          )}
        </div>

        <div className="tab-bar">
          {tabs.map(tab => (
            <Link key={tab.key} href={`/projects/${projectId}/${tab.key}`}
              className={cn('tab', activeTab === tab.key && 'active')}>
              <tab.icon size={14} />
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto" style={{ background: 'var(--surface)' }}>
        {children}
      </div>
    </div>
  )
}
