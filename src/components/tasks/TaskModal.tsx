'use client'
// src/components/tasks/TaskModal.tsx
import { useEffect, useState } from 'react'
import { TaskWithRelations, TaskPriority, TaskStatus } from '@/types'
import { X, Save, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  projectId: string
  task?: TaskWithRelations | null
  members: { id: string; name: string; email: string }[]
  defaultStatus?: TaskStatus
  onClose: () => void
  onSaved: () => void
}

export default function TaskModal({ projectId, task, members, defaultStatus = 'TODO', onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<{
    title: string
    description: string
    status: TaskStatus
    priority: TaskPriority
    deadline: string
    assigneeId: string
    progress: number
  }>({
    title:       task?.title       || '',
    description: task?.description || '',
    status:      task?.status      || defaultStatus,
    priority:    task?.priority    || 'MEDIUM',
    deadline:    task?.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
    assigneeId:  task?.assigneeId  || '',
    progress:    task?.progress    || 0,
  })

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [onClose])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const url    = task
        ? `/api/projects/${projectId}/tasks/${task.id}`
        : `/api/projects/${projectId}/tasks`
      const method = task ? 'PUT' : 'POST'
      const payload = { ...form, assigneeId: form.assigneeId || null }

      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()

      if (data.success) {
        toast.success(task ? 'Task diperbarui' : 'Task dibuat')
        onSaved()
      } else {
        toast.error(data.error || 'Gagal menyimpan task')
      }
    } finally {
      setLoading(false)
    }
  }

  async function deleteTask() {
    if (!task || !confirm('Hapus task ini?')) return
    const res = await fetch(`/api/projects/${projectId}/tasks/${task.id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Task dihapus'); onSaved() }
    else toast.error('Gagal menghapus task')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-semibold text-base" style={{ fontFamily: 'var(--font-display)', color: '#e8e8f0' }}>
            {task ? 'Edit Task' : 'Buat Task Baru'}
          </h2>
          <div className="flex items-center gap-2">
            {task && (
              <button onClick={deleteTask} className="btn btn-icon btn-danger" style={{ padding: '6px' }}>
                <Trash2 size={14} />
              </button>
            )}
            <button onClick={onClose} className="btn btn-icon btn-ghost" style={{ padding: '6px' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="label">Judul Task *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="input" placeholder="Apa yang perlu dikerjakan?" required />
          </div>

          {/* Description */}
          <div>
            <label className="label">Deskripsi</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="input resize-none" rows={3} placeholder="Detail task, catatan, atau referensi..." />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as TaskStatus }))} className="input">
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as TaskPriority }))} className="input">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          {/* Deadline & Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Deadline</label>
              <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Assign Ke</label>
              <select value={form.assigneeId} onChange={e => setForm(p => ({ ...p, assigneeId: e.target.value }))} className="input">
                <option value="">— Tidak di-assign —</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          {/* Progress */}
          <div>
            <label className="label">
              Progress — <span style={{ color: '#818cf8', fontFamily: 'var(--font-mono)' }}>{form.progress}%</span>
            </label>
            <input type="range" min={0} max={100} step={5} value={form.progress}
              onChange={e => setForm(p => ({ ...p, progress: Number(e.target.value) }))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer mt-2"
              style={{ accentColor: '#6366f1', background: `linear-gradient(to right, #6366f1 ${form.progress}%, rgba(255,255,255,0.08) ${form.progress}%)` }}
            />
            <div className="progress-track mt-2">
              <div className={`progress-fill ${form.progress === 100 ? 'done' : ''}`} style={{ width: `${form.progress}%` }} />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1 justify-center">Batal</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">
              {loading
                ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Menyimpan...</>
                : <><Save size={14} />{task ? 'Simpan' : 'Buat Task'}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
