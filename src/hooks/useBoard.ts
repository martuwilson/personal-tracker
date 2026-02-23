import { useState, useCallback, useEffect } from 'react';
import type { BoardState, Column, Task, Subtask, Priority, ProgressMode } from '../types';
import { loadBoard, saveBoard, defaultBoard, generateId, timestamp } from '../storage/storage';

function computeAutoProgress(subtasks: Subtask[]): number {
  if (subtasks.length === 0) return 0;
  const done = subtasks.filter((s) => s.completed).length;
  return Math.round((done / subtasks.length) * 100);
}

export function useBoard() {
  const [board, setBoard] = useState<BoardState>(() => loadBoard());

  // Auto-save on every change
  useEffect(() => {
    saveBoard(board);
  }, [board]);

  const update = useCallback((updater: (prev: BoardState) => BoardState) => {
    setBoard((prev) => updater(prev));
  }, []);

  // ── Columns ──────────────────────────────────────────────────────────────

  const addColumn = useCallback((title: string, color: string) => {
    update((prev) => {
      const maxOrder = prev.columns.reduce((m, c) => Math.max(m, c.order), -1);
      const col: Column = { id: generateId(), title, color, order: maxOrder + 1, createdAt: timestamp() };
      return { ...prev, columns: [...prev.columns, col] };
    });
  }, [update]);

  const updateColumn = useCallback((id: string, changes: Partial<Pick<Column, 'title' | 'color'>>) => {
    update((prev) => ({
      ...prev,
      columns: prev.columns.map((c) => c.id === id ? { ...c, ...changes } : c),
    }));
  }, [update]);

  const deleteColumn = useCallback((id: string) => {
    update((prev) => ({
      ...prev,
      columns: prev.columns.filter((c) => c.id !== id),
      tasks: prev.tasks.filter((t) => t.columnId !== id),
    }));
  }, [update]);

  const reorderColumns = useCallback((orderedIds: string[]) => {
    update((prev) => ({
      ...prev,
      columns: prev.columns.map((c) => ({ ...c, order: orderedIds.indexOf(c.id) })),
    }));
  }, [update]);

  // ── Tasks ─────────────────────────────────────────────────────────────────

  const addTask = useCallback((columnId: string, title: string) => {
    update((prev) => {
      const colTasks = prev.tasks.filter((t) => t.columnId === columnId);
      const maxOrder = colTasks.reduce((m, t) => Math.max(m, t.order), -1);
      const task: Task = {
        id: generateId(),
        columnId,
        title,
        description: '',
        priority: 'medium',
        tags: [],
        startDate: null,
        dueDate: null,
        progress: 0,
        progressMode: 'manual',
        subtasks: [],
        order: maxOrder + 1,
        createdAt: timestamp(),
        updatedAt: timestamp(),
      };
      return { ...prev, tasks: [...prev.tasks, task] };
    });
  }, [update]);

  const updateTask = useCallback((id: string, changes: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    update((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, ...changes, updatedAt: timestamp() };
        if (updated.progressMode === 'auto') {
          updated.progress = computeAutoProgress(updated.subtasks);
        }
        return updated;
      }),
    }));
  }, [update]);

  const deleteTask = useCallback((id: string) => {
    update((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) }));
  }, [update]);

  const moveTask = useCallback((taskId: string, newColumnId: string, newOrder: number) => {
    update((prev) => {
      const task = prev.tasks.find((t) => t.id === taskId);
      if (!task) return prev;

      // Remove from current position, re-order others in target column
      let tasks = prev.tasks.filter((t) => t.id !== taskId);

      // Re-index tasks in target column to make space
      const targetTasks = tasks
        .filter((t) => t.columnId === newColumnId)
        .sort((a, b) => a.order - b.order);

      targetTasks.splice(newOrder, 0, { ...task, columnId: newColumnId, order: newOrder, updatedAt: timestamp() });
      targetTasks.forEach((t, i) => { t.order = i; });

      const otherTasks = tasks.filter((t) => t.columnId !== newColumnId);
      return { ...prev, tasks: [...otherTasks, ...targetTasks] };
    });
  }, [update]);

  const reorderTasksInColumn = useCallback((columnId: string, orderedIds: string[]) => {
    update((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.columnId !== columnId) return t;
        return { ...t, order: orderedIds.indexOf(t.id), updatedAt: timestamp() };
      }),
    }));
  }, [update]);

  // ── Subtasks ──────────────────────────────────────────────────────────────

  const addSubtask = useCallback((taskId: string, title: string) => {
    update((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const subtask: Subtask = { id: generateId(), title, completed: false };
        const subtasks = [...t.subtasks, subtask];
        const progress = t.progressMode === 'auto' ? computeAutoProgress(subtasks) : t.progress;
        return { ...t, subtasks, progress, updatedAt: timestamp() };
      }),
    }));
  }, [update]);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    update((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks = t.subtasks.map((s) => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
        const progress = t.progressMode === 'auto' ? computeAutoProgress(subtasks) : t.progress;
        return { ...t, subtasks, progress, updatedAt: timestamp() };
      }),
    }));
  }, [update]);

  const deleteSubtask = useCallback((taskId: string, subtaskId: string) => {
    update((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks = t.subtasks.filter((s) => s.id !== subtaskId);
        const progress = t.progressMode === 'auto' ? computeAutoProgress(subtasks) : t.progress;
        return { ...t, subtasks, progress, updatedAt: timestamp() };
      }),
    }));
  }, [update]);

  const updateSubtask = useCallback((taskId: string, subtaskId: string, title: string) => {
    update((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks = t.subtasks.map((s) => s.id === subtaskId ? { ...s, title } : s);
        return { ...t, subtasks, updatedAt: timestamp() };
      }),
    }));
  }, [update]);

  // ── Board ─────────────────────────────────────────────────────────────────

  const resetBoard = useCallback(() => {
    const fresh = defaultBoard();
    setBoard(fresh);
    saveBoard(fresh);
  }, []);

  const loadImported = useCallback((imported: BoardState) => {
    setBoard(imported);
    saveBoard(imported);
  }, []);

  return {
    board,
    // columns
    addColumn, updateColumn, deleteColumn, reorderColumns,
    // tasks
    addTask, updateTask, deleteTask, moveTask, reorderTasksInColumn,
    // subtasks
    addSubtask, toggleSubtask, deleteSubtask, updateSubtask,
    // board
    resetBoard, loadImported,
  };
}
