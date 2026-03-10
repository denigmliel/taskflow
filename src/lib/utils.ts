// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'd MMM yyyy', { locale: localeId })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return format(new Date(date), 'd MMM yyyy, HH:mm', { locale: localeId })
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: localeId })
}

export function isOverdue(deadline?: string | Date | null, status?: string): boolean {
  if (!deadline || status === 'DONE') return false
  return isPast(new Date(deadline))
}

export function deadlineBadge(deadline?: string | Date | null, status?: string): {
  label: string; color: string; urgent: boolean
} {
  if (!deadline) return { label: '', color: '', urgent: false }
  const d = new Date(deadline)
  const done = status === 'DONE'
  if (done)         return { label: formatDate(d), color: 'text-slate-500', urgent: false }
  if (isPast(d))    return { label: 'Overdue!', color: 'text-red-400', urgent: true }
  if (isToday(d))   return { label: 'Hari ini', color: 'text-amber-400', urgent: true }
  if (isTomorrow(d))return { label: 'Besok', color: 'text-amber-400', urgent: false }
  const diff = differenceInDays(d, new Date())
  if (diff <= 3)    return { label: `${diff} hari lagi`, color: 'text-amber-400', urgent: false }
  return { label: formatDate(d), color: 'text-slate-400', urgent: false }
}

export const PRIORITY_CONFIG = {
  HIGH:   { label: 'High',   dot: 'bg-red-500',    badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
  MEDIUM: { label: 'Medium', dot: 'bg-amber-500',  badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  LOW:    { label: 'Low',    dot: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
} as const

export const STATUS_CONFIG = {
  TODO:        { label: 'To Do',       color: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/20',   dot: 'bg-slate-500' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    dot: 'bg-blue-500' },
  DONE:        { label: 'Done',        color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
} as const

export const PROJECT_STATUS_CONFIG = {
  ACTIVE:    { label: 'Aktif',      color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ON_HOLD:   { label: 'Ditahan',    color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  COMPLETED: { label: 'Selesai',    color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  ARCHIVED:  { label: 'Diarsipkan', color: 'text-slate-400',   bg: 'bg-slate-500/10' },
} as const

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function getAvatarGradient(id: string): string {
  const gradients = [
    'from-violet-500 to-indigo-600',
    'from-pink-500 to-rose-600',
    'from-teal-500 to-cyan-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-green-600',
    'from-blue-500 to-indigo-600',
  ]
  const idx = id.charCodeAt(0) % gradients.length
  return gradients[idx]
}

export const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
]
