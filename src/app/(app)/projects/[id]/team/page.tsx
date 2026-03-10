'use client'
// src/app/(app)/projects/[id]/team/page.tsx
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { UserPlus, Trash2, Mail, CheckSquare2, X } from 'lucide-react'
import { getInitials, getAvatarGradient } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function TeamPage() {
  const { id: projectId } = useParams() as { id: string }
  const [members, setMembers]     = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [email, setEmail]         = useState('')
  const [adding, setAdding]       = useState(false)

  const load = () => {
    fetch(`/api/projects/${projectId}/members`).then(r => r.json()).then(r => {
      if (r.success) setMembers(r.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [projectId])

  async function addMember(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    try {
      const res  = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Member ditambahkan')
        setEmail(''); setShowForm(false); load()
      } else {
        toast.error(data.error || 'Gagal menambah member')
      }
    } finally {
      setAdding(false)
    }
  }

  async function removeMember(userId: string, name: string) {
    if (!confirm(`Hapus ${name} dari project?`)) return
    const res = await fetch(`/api/projects/${projectId}/members/${userId}`, { method: 'DELETE' })
    if (res.ok) {
      setMembers(p => p.filter(m => m.userId !== userId))
      toast.success('Member dihapus')
    } else {
      const d = await res.json()
      toast.error(d.error || 'Gagal menghapus member')
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto animate-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#e8e8f0' }}>Anggota Tim</h2>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>{members.length} anggota</p>
        </div>
        <button onClick={() => setShowForm(p => !p)} className="btn btn-primary btn-sm">
          {showForm ? <><X size={14} />Batal</> : <><UserPlus size={14} />Tambah Member</>}
        </button>
      </div>

      {showForm && (
        <div className="card p-5 mb-5 animate-up">
          <h3 className="font-semibold text-sm mb-3" style={{ color: '#e8e8f0' }}>Tambah Member via Email</h3>
          <form onSubmit={addMember} className="flex gap-3">
            <div className="relative flex-1">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input pl-9 text-sm" placeholder="email@contoh.com" required />
            </div>
            <button type="submit" disabled={adding} className="btn btn-primary btn-sm">
              {adding ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : 'Tambah'}
            </button>
          </form>
          <p className="text-xs mt-2" style={{ color: 'var(--text-3)' }}>
            User harus sudah terdaftar di TaskFlow dengan email tersebut.
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 skeleton" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member, i) => {
            const u = member.user
            const tasks = u.assignedTasks || []
            const done = tasks.filter((t: any) => t.status === 'DONE').length

            return (
              <div key={member.id} className="card p-4 flex items-center gap-4 animate-up" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className={`avatar w-11 h-11 text-sm font-bold bg-gradient-to-br ${getAvatarGradient(u.id)} text-white flex-shrink-0`}>
                  {getInitials(u.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm" style={{ color: '#e8e8f0' }}>{u.name}</p>
                    <span className="badge text-[10px]"
                      style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                      Project Admin
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>{u.email}</p>
                </div>
                <div className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: 'var(--text-3)' }}>
                  <CheckSquare2 size={12} />
                  <span>{done}/{tasks.length}</span>
                </div>
                <button onClick={() => removeMember(u.id, u.name)}
                  className="btn btn-icon btn-ghost flex-shrink-0 opacity-0 group-hover:opacity-100"
                  style={{ padding: '6px' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                  onMouseLeave={e => (e.currentTarget.style.color = '')}>
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
