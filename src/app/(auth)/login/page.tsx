'use client'

import Link from 'next/link'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  Layers,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Users,
  ShieldCheck,
  Zap,
} from 'lucide-react'

const highlights = [
  { label: 'Multi-user Workspace', icon: Users },
  { label: 'Secure Session', icon: ShieldCheck },
  { label: 'Realtime Updates', icon: Zap },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })

      if (res?.ok) {
        toast.success('Selamat datang')
        router.push('/dashboard')
        router.refresh()
      } else if (res?.error && res.error !== 'CredentialsSignin') {
        toast.error(`Login gagal (${res.error})`)
      } else {
        toast.error('Email atau password salah')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-modern min-h-dvh relative overflow-hidden">
      <div className="auth-grid" />
      <div className="auth-blob auth-blob-a" />
      <div className="auth-blob auth-blob-b" />
      <div className="auth-blob auth-blob-c" />

      <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-5 py-12 sm:px-8">
        <section className="text-center animate-up">
          <div className="inline-flex items-center gap-3 rounded-full px-4 py-2 auth-pill">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
            >
              <Layers size={16} className="text-white" />
            </div>
            <span className="text-lg sm:text-xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              TaskFlow
            </span>
          </div>

          <h1 className="mt-8 text-4xl sm:text-6xl leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Masuk untuk mengelola
            <br />
            <span className="auth-gradient-text not-italic">proyek tim dengan rapi</span>
          </h1>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {highlights.map(({ label, icon: Icon }) => (
              <span key={label} className="auth-chip">
                <Icon size={13} />
                {label}
              </span>
            ))}
          </div>
        </section>

        <section className="w-full max-w-md mx-auto mt-8 sm:mt-10 auth-login-card animate-up">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles size={15} className="text-indigo-300" />
            <span className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-2)' }}>
              Secure Access
            </span>
          </div>

          <h2 className="text-2xl font-semibold" style={{ color: '#eef1ff' }}>
            Masuk ke akun
          </h2>
          <p className="text-sm mt-1 mb-6" style={{ color: 'var(--text-2)' }}>
            Masuk untuk melanjutkan pekerjaan Anda.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-9"
                  placeholder="nama@contoh.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-9 pr-10"
                  placeholder="Masukkan password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-3)' }}
                  aria-label={showPw ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2 auth-submit-btn" style={{ padding: '12px' }}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Masuk...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Masuk <ArrowRight size={15} />
                </span>
              )}
            </button>
          </form>

          <p className="text-sm mt-6 text-center" style={{ color: 'var(--text-2)' }}>
            Belum punya akun?{' '}
            <Link href="/register" className="font-medium" style={{ color: '#a8b4ff' }}>
              Daftar di sini
            </Link>
          </p>
        </section>
      </main>
    </div>
  )
}
