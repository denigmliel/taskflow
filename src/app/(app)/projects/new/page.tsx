'use client'
// src/app/(app)/projects/new/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, FolderPlus, Check } from 'lucide-react'
import { PRESET_COLORS } from '@/lib/utils'

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', color: PRESET_COLORS[0], startDate: '', endDate: '',
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Project berhasil dibuat!')
        router.push(`/projects/${data.data.id}/board`)
      } else {
        toast.error(data.error || 'Gagal membuat project')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto animate-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/projects" className="btn btn-icon btn-ghost">
          <ArrowLeft size={17} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#e8e8f0' }}>
            Buat Project Baru
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Isi detail project kamu</p>
        </div>
      </div>

      <form onSubmit={submit} className="card p-6 space-y-5">
        {/* Color picker */}
        <div>
          <label className="label">Warna Project</label>
          <div className="flex flex-wrap gap-2 items-center">
            {PRESET_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                className="relative w-8 h-8 rounded-lg transition-transform"
                style={{ background: c, transform: form.color === c ? 'scale(1.15)' : 'scale(1)' }}>
                {form.color === c && (
                  <Check size={14} className="absolute inset-0 m-auto text-white" />
                )}
              </button>
            ))}
            <div className="relative w-8 h-8 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                className="absolute inset-0 w-full h-full cursor-pointer opacity-0" />
              <div className="w-full h-full" style={{ background: form.color }} />
            </div>
            <span className="font-mono text-xs" style={{ color: 'var(--text-3)' }}>{form.color}</span>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="label">Nama Project *</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="input" placeholder="Mis: Website Redesign Q3" required />
        </div>

        {/* Description */}
        <div>
          <label className="label">Deskripsi</label>
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            className="input resize-none" rows={3} placeholder="Tujuan dan scope project ini..." />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Tanggal Mulai</label>
            <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Deadline</label>
            <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="input" />
          </div>
        </div>

        {/* Preview */}
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
          <Link href="/projects" className="btn btn-ghost flex-1 justify-center">Batal</Link>
          <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">
            {loading
              ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Membuat...</>
              : <><FolderPlus size={15} />Buat Project</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}
