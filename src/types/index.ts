export type Priority = 'low' | 'medium' | 'high';
export type ProgressMode = 'manual' | 'auto';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  columnId: string;
  title: string;
  description: string;
  priority: Priority;
  tags: string[];
  startDate: string | null;
  dueDate: string | null;
  progress: number; // 0–100
  progressMode: ProgressMode;
  subtasks: Subtask[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  color: string;
  order: number;
  createdAt: string;
}

export interface BoardState {
  columns: Column[];
  tasks: Task[];
  version: number;
  lastUpdated: string;
}

export interface FilterState {
  search: string;
  priority: Priority | 'all';
}
