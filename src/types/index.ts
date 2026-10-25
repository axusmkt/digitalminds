export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt?: string;
}

export interface WorkspaceMember {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  ownerId: string;
  members: string[]; // array of userIds
  memberDetails?: Record<string, WorkspaceMember>;
  createdAt: string;
  updatedAt: string;
}

export type BlockType =
  | 'paragraph'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bullet_list'
  | 'numbered_list'
  | 'todo'
  | 'quote'
  | 'callout'
  | 'code'
  | 'divider'
  | 'table'
  | 'image'
  | 'database_view';

export interface TableCell {
  text: string;
}

export interface BlockContent {
  text?: string;
  checked?: boolean; // for todo
  language?: string; // for code
  calloutIcon?: string; // for callout
  url?: string; // for image
  caption?: string; // for image
  tableRows?: TableCell[][]; // for table
  databaseId?: string; // for database_view
}

export interface PageBlock {
  id: string;
  type: BlockType;
  content: BlockContent;
  order: number;
}

export interface PageDocument {
  id: string;
  workspaceId: string;
  parentId: string | null;
  title: string;
  icon?: string;
  coverImage?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  isShared?: boolean;
  sharedRole?: UserRole;
  blocks: PageBlock[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // YYYY-MM-DD
  startDate?: string;
  completedAt?: string;
  projectId?: string;
  pageId?: string;
  assigneeId?: string;
  subtasks: Subtask[];
  tags: string[];
  estimatedMinutes?: number;
  timeSpentMinutes?: number;
  time?: string; // HH:mm for scheduled appointments / commitments
  itemType?: 'task' | 'meeting' | 'call' | 'appointment' | 'deadline';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type ProjectStatus = 'planned' | 'in_progress' | 'paused' | 'completed' | 'cancelled';

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  status: ProjectStatus;
  priority: TaskPriority;
  startDate?: string;
  targetDate?: string;
  ownerId: string;
  tags: string[];
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type PropertyType =
  | 'text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'status'
  | 'date'
  | 'checkbox'
  | 'url'
  | 'email';

export interface DatabaseProperty {
  id: string;
  name: string;
  type: PropertyType;
  options?: { id: string; label: string; color: string }[];
}

export type DatabaseViewType = 'table' | 'kanban' | 'list' | 'gallery';

export interface DatabaseViewConfig {
  id: string;
  name: string;
  type: DatabaseViewType;
  groupByPropertyId?: string;
  filterByStatus?: string;
  sortByPropertyId?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface DatabaseSchema {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  icon?: string;
  properties: DatabaseProperty[];
  views: DatabaseViewConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseRecordItem {
  id: string;
  databaseId: string;
  workspaceId: string;
  title: string;
  values: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type GoalStatus = 'not_started' | 'in_progress' | 'achieved' | 'paused';

export interface Goal {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  category: string;
  startDate?: string;
  targetDate?: string;
  currentValue: number;
  targetValue: number;
  metric: string; // '%', 'R$', 'un', 'hrs'
  status: GoalStatus;
  relatedTaskIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly';
  targetDays: number[]; // 0-6 (0 = Sun, 1 = Mon...)
  icon?: string;
  color?: string;
  streak: number;
  paused?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  workspaceId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
  userId: string;
}

export interface QuickNote {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  tags: string[];
  isPinned?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentItem {
  id: string;
  workspaceId: string;
  targetType: 'page' | 'task' | 'project';
  targetId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'mention' | 'comment' | 'invite' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export type ActiveNavView =
  | 'dashboard'
  | 'inbox'
  | 'tasks'
  | 'today'
  | 'upcoming'
  | 'calendar'
  | 'projects'
  | 'project-detail'
  | 'goals'
  | 'habits'
  | 'databases'
  | 'database-detail'
  | 'page'
  | 'trash';
