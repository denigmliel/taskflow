'use client'
// src/app/(app)/projects/[id]/edit/page.tsx
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Check } from 'lucide-react'
import { PRESET_COLORS, PROJECT_STATUS_CONFIG } from '@/lib/utils'
import { ProjectStatus } from '@/types'

function toDateInputValue(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function EditProjectPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: PRESET_COLORS[0],
    status: 'ACTIVE' as ProjectStatus,
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    fetch(`/api/projects/${id}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!data?.success) {
          toast.error(data?.error || 'Project tidak ditemukan')
          router.push('/projects')
          return
        }
        const project = data.data
        setForm({
          name: project.name || '',
          description: project.description || '',
          color: project.color || PRESET_COLORS[0],
          status: project.status || 'ACTIVE',
          startDate: toDateInputValue(project.startDate),
          endDate: toDateInputValue(project.endDate),
        })
      })
      .catch(() => {
        toast.error('Gagal memuat project')
        router.push('/projects')
      })
      .finally(() => setLoading(false))
  }, [id, router])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.success) {
        toast.success('Project berhasil diperbarui')
        router.push(`/projects/${id}/board`)
        return
      }
      toast.error(data?.error || 'Gagal memperbarui project')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="h-8 skeleton w-48 mb-6" />
        <div className="card p-6 space-y-4">
          <div className="h-10 skeleton" />
          <div className="h-24 skeleton" />
          <div className="h-10 skeleton" />
          <div className="h-10 skeleton" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-xl mx-auto animate-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/projects/${id}/board`} className="btn btn-icon btn-ghost">
          <ArrowLeft size={17} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#e8e8f0' }}>
            Edit Project
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Perbarui detail project</p>
        </div>
      </div>

      <form onSubmit={submit} className="card p-6 space-y-5">
        <div>
          <label className="label">Warna Project</label>
          <div className="flex flex-wrap gap-2 items-center">
            {PRESET_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setForm((p) => ({ ...p, color: c }))}
                className="relative w-8 h-8 rounded-lg transition-transform"
                style={{ background: c, transform: form.color === c ? 'scale(1.15)' : 'scale(1)' }}>
                {form.color === c && (
                  <Check size={14} className="absolute inset-0 m-auto text-white" />
                )}
              </button>
            ))}
            <div className="relative w-8 h-8 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <input type="color" value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                className="absolute inset-0 w-full h-full cursor-pointer opacity-0" />
              <div className="w-full h-full" style={{ background: form.color }} />
            </div>
            <span className="font-mono text-xs" style={{ color: 'var(--text-3)' }}>{form.color}</span>
          </div>
        </div>

        <div>
          <label className="label">Nama Project *</label>
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="input" placeholder="Mis: Website Redesign Q3" required />
        </div>

        <div>
          <label className="label">Deskripsi</label>
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="input resize-none" rows={3} placeholder="Tujuan dan scope project ini..." />
        </div>

        <div>
          <label className="label">Status</label>
          <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ProjectStatus }))}
            className="input">
            {(Object.keys(PROJECT_STATUS_CONFIG) as ProjectStatus[]).map((status) => (
              <option key={status} value={status}>
                {PROJECT_STATUS_CONFIG[status].label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Tanggal Mulai</label>
            <input type="date" value={form.startDate}
              onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
              className="input" />
          </div>
          <div>
            <label className="label">Deadline</label>
            <input type="date" value={form.endDate}
              onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
              className="input" />
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border)' }}>
          <p className="text-[10px] font-semibold mb-3 tracking-widest uppercase" style={{ color: 'var(--text-3)' }}>Preview</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl" style={{ background: form.color }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: '#e8e8f0' }}>{form.name || 'Nama Project'}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{form.description || 'Deskripsi...'}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Link href={`/projects/${id}/board`} className="btn btn-ghost flex-1 justify-center">Batal</Link>
          <button type="submit" disabled={saving} className="btn btn-primary flex-1 justify-center">
            {saving
              ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Menyimpan...</>
              : <><Save size={15} />Simpan Perubahan</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}
