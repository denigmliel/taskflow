// src/types/index.ts
import { Project, Task, User, ActivityLog, ProjectMember, TaskStatus, TaskPriority, ProjectStatus, Role } from '@prisma/client'

export type { TaskStatus, TaskPriority, ProjectStatus, Role }

export type UserSafe = Omit<User, 'password'>

export type ProjectWithRelations = Project & {
  owner: UserSafe
  members: (ProjectMember & { user: UserSafe })[]
  _count: { tasks: number }
  taskStats?: {
    total: number
    todo: number
    inProgress: number
    done: number
    overdue: number
  }
}

export type TaskWithRelations = Task & {
  assignee?: UserSafe | null
  creator: UserSafe
}

export type ActivityWithUser = ActivityLog & {
  user: UserSafe
}

export type BoardData = {
  TODO: TaskWithRelations[]
  IN_PROGRESS: TaskWithRelations[]
  DONE: TaskWithRelations[]
}

export type DashboardStats = {
  totalProjects: number
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overdueTasks: number
  completionRate: number
  myTasks: TaskWithRelations[]
  recentProjects: ProjectWithRelations[]
  tasksByStatus: { name: string; value: number; color: string }[]
  tasksByPriority: { name: string; value: number; color: string }[]
}

export type ApiResponse<T = unknown> =
  | { success: true;  data: T }
  | { success: false; error: string }
