'use client'
// src/app/(app)/projects/page.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, FolderOpen, Calendar, MoreVertical, Trash2, Edit2, Users } from 'lucide-react'
import { ProjectWithRelations } from '@/types'
import { formatDate, PROJECT_STATUS_CONFIG, getInitials, getAvatarGradient, PRESET_COLORS } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithRelations[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [menu, setMenu]         = useState<string | null>(null)

  const load = () => {
    fetch('/api/projects').then(r => r.json()).then(r => {
      if (r.success) setProjects(r.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function deleteProject(id: string, name: string) {
    if (!confirm(`Hapus project "${name}"? Semua task akan ikut terhapus.`)) return
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setProjects(p => p.filter(pr => pr.id !== id))
      toast.success('Project dihapus')
    } else {
      toast.error('Gagal menghapus project')
    }
  }

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#e8e8f0' }}>Projects</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>{projects.length} project aktif</p>
        </div>
        <Link href="/projects/new" className="btn btn-primary self-start sm:self-auto">
          <Plus size={15} />
          Buat Project
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="input pl-9" placeholder="Cari project..." />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <FolderOpen size={40} className="mb-3 opacity-30" />
          <p className="font-medium" style={{ color: 'var(--text-2)' }}>Belum ada project</p>
          <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-3)' }}>Mulai buat project pertama kamu</p>
          <Link href="/projects/new" className="btn btn-primary btn-sm"><Plus size={14} />Buat Project</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project, i) => {
            const stats = (project as any).taskStats
            const pct   = stats?.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
            const sConf = PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG]

            return (
              <div key={project.id} className={`card p-5 group relative animate-up stagger-${Math.min(i+1, 4)}`}>
                {/* Actions */}
                <div className="absolute top-4 right-4 z-10">
                  <button onClick={e => { e.preventDefault(); setMenu(menu === project.id ? null : project.id) }}
                    className="btn btn-icon btn-ghost opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ padding: '5px' }}>
                    <MoreVertical size={15} />
                  </button>
                  {menu === project.id && (
                    <div className="absolute right-0 top-8 rounded-xl py-1 min-w-[150px] shadow-2xl z-20"
                      style={{ background: '#1e1e32', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <Link href={`/projects/${project.id}/edit`} onClick={() => setMenu(null)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
                        style={{ color: 'var(--text-2)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#e8e8f0')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}>
                        <Edit2 size={13} />Edit
                      </Link>
                      <button onClick={() => { setMenu(null); deleteProject(project.id, project.name) }}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm w-full transition-colors text-left"
                        style={{ color: '#f87171' }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(244,63,94,0.08)')}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}>
                        <Trash2 size={13} />Hapus
                      </button>
                    </div>
                  )}
                </div>

                <Link href={`/projects/${project.id}/board`} className="block">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: project.color }} />
                    <div className="min-w-0 pr-8">
                      <h3 className="font-semibold text-sm truncate" style={{ color: '#e8e8f0' }}>{project.name}</h3>
                      <span className={`badge mt-1 ${sConf.bg} ${sConf.color}`} style={{ fontSize: '10px' }}>
                        {sConf.label}
                      </span>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-xs mb-4 line-clamp-2" style={{ color: 'var(--text-2)' }}>{project.description}</p>
                  )}

                  {/* Progress */}
                  {stats && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-3)' }}>
                        <span>{stats.done}/{stats.total} selesai</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="progress-track">
                        <div className={`progress-fill ${pct === 100 ? 'done' : ''}`} style={{ width: `${pct}%` }} />
                      </div>
                      {stats.overdue > 0 && (
                        <p className="text-xs mt-1" style={{ color: '#f87171' }}>⚠ {stats.overdue} task overdue</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {project.members?.slice(0, 4).map(m => (
                        <div key={m.id} title={m.user.name}
                          className={`avatar w-6 h-6 text-[9px] font-bold bg-gradient-to-br ${getAvatarGradient(m.userId)} text-white`}
                          style={{ border: '2px solid var(--card)' }}>
                          {getInitials(m.user.name)}
                        </div>
                      ))}
                      {(project.members?.length || 0) > 4 && (
                        <div className="avatar w-6 h-6 text-[9px] font-bold text-white"
                          style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid var(--card)' }}>
                          +{project.members.length - 4}
                        </div>
                      )}
                    </div>
                    {project.endDate && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-3)' }}>
                        <Calendar size={11} />{formatDate(project.endDate)}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {menu && <div className="fixed inset-0 z-10" onClick={() => setMenu(null)} />}
    </div>
  )
}
