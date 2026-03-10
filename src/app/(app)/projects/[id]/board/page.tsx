'use client'
// src/app/(app)/projects/[id]/board/page.tsx
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, closestCorners, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskWithRelations, TaskStatus } from '@/types'
import {
  PRIORITY_CONFIG, STATUS_CONFIG, deadlineBadge,
  formatDate, getInitials, getAvatarGradient, cn,
} from '@/lib/utils'
import {
  Plus, GripVertical, AlertCircle, Calendar,
  Circle, Clock4, CheckCircle2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import TaskModal from '@/components/tasks/TaskModal'

const COLS: { id: TaskStatus; label: string; icon: React.ElementType; accent: string }[] = [
  { id: 'TODO',        label: 'To Do',       icon: Circle,       accent: '#64748b' },
  { id: 'IN_PROGRESS', label: 'In Progress', icon: Clock4,       accent: '#3b82f6' },
  { id: 'DONE',        label: 'Done',        icon: CheckCircle2, accent: '#22c55e' },
]

// Task card component
function TaskCard({ task, onClick, dragProps }: {
  task: TaskWithRelations;
  onClick: () => void;
  dragProps?: ReturnType<typeof useSortable>
}) {
  const pConf = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]
  const dl    = deadlineBadge(task.deadline?.toString(), task.status)

  return (
    <div className="task-card" onClick={onClick}>
      <div className="flex items-start gap-2">
        {dragProps && (
          <div {...dragProps.listeners}
            className="mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing"
            style={{ color: 'var(--text-3)', touchAction: 'none' }}
            onClick={e => e.stopPropagation()}>
            <GripVertical size={14} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-sm font-medium leading-snug" style={{ color: '#e8e8f0' }}>{task.title}</h4>
            <span className={`badge flex-shrink-0 text-[10px] ${pConf?.badge}`}>
              {pConf?.label}
            </span>
          </div>

          {task.description && (
            <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-2)' }}>
              {task.description}
            </p>
          )}

          {task.progress > 0 && task.status !== 'DONE' && (
            <div className="mb-3">
              <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--text-3)' }}>
                <span>Progress</span><span>{task.progress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${task.progress}%` }} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            {dl.label ? (
              <span className={`flex items-center gap-1 text-[10px] ${dl.color}`}>
                {dl.urgent ? <AlertCircle size={10} /> : <Calendar size={10} />}
                {dl.label}
              </span>
            ) : <span />}

            {task.assignee && (
              <div title={task.assignee.name}
                className={`avatar w-6 h-6 text-[9px] font-bold bg-gradient-to-br ${getAvatarGradient(task.assignee.id)} text-white`}>
                {getInitials(task.assignee.name)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Sortable wrapper
function SortableCard({ task, onClick }: { task: TaskWithRelations; onClick: () => void }) {
  const dnd = useSortable({ id: task.id })
  return (
    <div ref={dnd.setNodeRef}
      style={{ transform: CSS.Transform.toString(dnd.transform), transition: dnd.transition, opacity: dnd.isDragging ? 0.4 : 1 }}
      {...dnd.attributes}>
      <TaskCard task={task} onClick={onClick} dragProps={dnd} />
    </div>
  )
}

export default function BoardPage() {
  const params    = useParams()
  const projectId = params.id as string

  const [board, setBoard]           = useState<Record<TaskStatus, TaskWithRelations[]>>({ TODO: [], IN_PROGRESS: [], DONE: [] })
  const [members, setMembers]       = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [dragging, setDragging]     = useState<TaskWithRelations | null>(null)
  const [modal, setModal]           = useState(false)
  const [editTask, setEditTask]     = useState<TaskWithRelations | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('TODO')
  const [search, setSearch]         = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const fetchBoard = useCallback(() => {
    const params2 = new URLSearchParams()
    if (search)         params2.set('search', search)
    if (filterPriority) params2.set('priority', filterPriority)

    fetch(`/api/projects/${projectId}/tasks?${params2}`).then(r => r.json()).then(r => {
      if (r.success) setBoard(r.data.board)
    }).finally(() => setLoading(false))
  }, [projectId, search, filterPriority])

  useEffect(() => { fetchBoard() }, [fetchBoard])

  useEffect(() => {
    fetch(`/api/projects/${projectId}/members`).then(r => r.json()).then(r => {
      if (r.success) setMembers(r.data.map((m: any) => m.user))
    })
  }, [projectId])

  function handleDragStart(e: DragStartEvent) {
    const task = Object.values(board).flat().find(t => t.id === e.active.id)
    setDragging(task || null)
  }

  async function handleDragEnd(e: DragEndEvent) {
    setDragging(null)
    const { active, over } = e
    if (!over) return

    const task = Object.values(board).flat().find(t => t.id === active.id)
    if (!task) return

    let target: TaskStatus = task.status
    if (COLS.find(c => c.id === over.id)) {
      target = over.id as TaskStatus
    } else {
      for (const [col, tasks] of Object.entries(board)) {
        if (tasks.find(t => t.id === over.id)) { target = col as TaskStatus; break }
      }
    }

    if (target === task.status) return

    // Optimistic update
    setBoard(prev => {
      const next = { ...prev }
      next[task.status] = next[task.status].filter(t => t.id !== task.id)
      next[target] = [{ ...task, status: target }, ...next[target]]
      return next
    })

    try {
      await fetch(`/api/projects/${projectId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: target }),
      })
      toast.success(`Dipindah ke ${STATUS_CONFIG[target].label}`)
    } catch {
      toast.error('Gagal memindah task')
      fetchBoard()
    }
  }

  const openNew = (status: TaskStatus) => {
    setEditTask(null)
    setDefaultStatus(status)
    setModal(true)
  }
  const openEdit = (task: TaskWithRelations) => {
    setEditTask(task)
    setModal(true)
  }

  return (
    <div className="p-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="input w-48 text-sm" placeholder="🔍 Cari task..." style={{ padding: '7px 12px' }} />
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="input w-36 text-sm" style={{ padding: '7px 12px' }}>
          <option value="">Semua Priority</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {loading ? (
        <div className="grid gap-4 md:flex">
          {[1,2,3].map(i => <div key={i} className="h-80 md:h-96 md:flex-1 skeleton rounded-xl" />)}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners}
          onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid gap-4 pb-4 md:flex md:overflow-x-auto">
            {COLS.map(col => {
              const tasks = board[col.id] || []
              return (
                <div key={col.id} className="board-column w-full md:w-[300px] md:flex-shrink-0">
                  {/* Column header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <col.icon size={15} style={{ color: col.accent }} />
                      <span className="font-semibold text-sm" style={{ color: '#e8e8f0' }}>{col.label}</span>
                      <span className="w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-3)' }}>
                        {tasks.length}
                      </span>
                    </div>
                    <button onClick={() => openNew(col.id)}
                      className="btn btn-icon btn-ghost" style={{ padding: '5px' }}>
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Task list */}
                  <SortableContext id={col.id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="p-3 space-y-2 min-h-[200px]">
                      {tasks.map(task => (
                        <SortableCard key={task.id} task={task} onClick={() => openEdit(task)} />
                      ))}
                      {tasks.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <div className="w-8 h-8 rounded-full mb-2 flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <col.icon size={14} style={{ color: 'var(--text-3)' }} />
                          </div>
                          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Kosong</p>
                          <button onClick={() => openNew(col.id)}
                            className="text-xs mt-2 transition-colors" style={{ color: 'var(--text-3)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = '#818cf8')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
                            + Tambah task
                          </button>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              )
            })}
          </div>

          <DragOverlay>
            {dragging && (
              <div className="rotate-2 opacity-95 shadow-2xl">
                <TaskCard task={dragging} onClick={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {modal && (
        <TaskModal
          projectId={projectId}
          task={editTask}
          members={members}
          defaultStatus={defaultStatus}
          onClose={() => { setModal(false); setEditTask(null) }}
          onSaved={() => { setModal(false); setEditTask(null); fetchBoard() }}
        />
      )}
    </div>
  )
}
