import { v4 as uuidv4 } from 'uuid';
import type { BoardState, Column, Task } from '../types';

export const STORAGE_KEY = 'personal_task_tracker_v1';

function now(): string {
  return new Date().toISOString();
}

export function defaultBoard(): BoardState {
  const col1: Column = { id: uuidv4(), title: 'Backlog', color: '#4a9eff', order: 0, createdAt: now() };
  const col2: Column = { id: uuidv4(), title: 'In Progress', color: '#9c8eff', order: 1, createdAt: now() };
  const col3: Column = { id: uuidv4(), title: 'Done', color: '#4ade80', order: 2, createdAt: now() };

  const sampleTasks: Task[] = [
    {
      id: uuidv4(), columnId: col1.id, title: 'Design system setup', description: 'Define color tokens, spacing scale and typography.',
      priority: 'high', tags: ['design', 'setup'], startDate: null, dueDate: null,
      progress: 0, progressMode: 'auto', subtasks: [
        { id: uuidv4(), title: 'Choose color palette', completed: true },
        { id: uuidv4(), title: 'Define spacing scale', completed: false },
        { id: uuidv4(), title: 'Typography tokens', completed: false },
      ], order: 0, createdAt: now(), updatedAt: now(),
    },
    {
      id: uuidv4(), columnId: col2.id, title: 'Implement Kanban board', description: 'Build columns with drag and drop support.',
      priority: 'high', tags: ['frontend', 'feature'], startDate: null, dueDate: null,
      progress: 60, progressMode: 'manual', subtasks: [
        { id: uuidv4(), title: 'Column layout', completed: true },
        { id: uuidv4(), title: 'Card component', completed: true },
        { id: uuidv4(), title: 'Drag & Drop', completed: false },
      ], order: 0, createdAt: now(), updatedAt: now(),
    },
    {
      id: uuidv4(), columnId: col3.id, title: 'Project initialization', description: 'Vite + React + TypeScript scaffolding and initial config.',
      priority: 'medium', tags: ['setup'], startDate: null, dueDate: null,
      progress: 100, progressMode: 'auto', subtasks: [
        { id: uuidv4(), title: 'Create Vite project', completed: true },
        { id: uuidv4(), title: 'Install dependencies', completed: true },
      ], order: 0, createdAt: now(), updatedAt: now(),
    },
  ];

  return { columns: [col1, col2, col3], tasks: sampleTasks, version: 1, lastUpdated: now() };
}

export function loadBoard(): BoardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultBoard();
    const parsed = JSON.parse(raw) as BoardState;
    // Validate shape — fall back if corrupted
    if (!Array.isArray(parsed.columns) || !Array.isArray(parsed.tasks)) {
      return defaultBoard();
    }
    return parsed;
  } catch {
    return defaultBoard();
  }
}

export function saveBoard(state: BoardState): void {
  try {
    const toSave = { ...state, lastUpdated: now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Failed to save board:', e);
  }
}

export function exportBoard(state: BoardState): void {
  const json = JSON.stringify({ ...state, exportedAt: now() }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `task-tracker-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBoard(file: File): Promise<BoardState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as BoardState;
        if (!parsed.columns || !parsed.tasks) {
          reject(new Error('Invalid file format'));
          return;
        }
        resolve({ ...parsed, version: (parsed.version ?? 0) + 1, lastUpdated: now() });
      } catch {
        reject(new Error('Failed to parse JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function generateId(): string {
  return uuidv4();
}

export function timestamp(): string {
  return now();
}
