import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../types';
import { PriorityBadge, TagBadge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

interface TaskCardProps {
  task: Task;
  onOpen: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onOpen, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const completedSubs = task.subtasks.filter((s) => s.completed).length;
  const dueOverdue = isOverdue(task.dueDate);

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete(task.id);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`card${isDragging ? ' card--dragging' : ''}`}
      onClick={() => onOpen(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(task)}
      aria-label={`Open task: ${task.title}`}
    >
      <div className="card__header">
        <span className="card__title">{task.title}</span>
        <div className="card__actions">
          <button
            className="btn btn--icon"
            onClick={handleDeleteClick}
            title="Delete task"
            aria-label="Delete task"
            style={{ width: 24, height: 24 }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {task.description && (
        <p className="card__description">{task.description}</p>
      )}

      <div className="card__meta">
        <PriorityBadge priority={task.priority} />
        {task.tags.slice(0, 2).map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
        {task.tags.length > 2 && (
          <span className="badge badge--tag">+{task.tags.length - 2}</span>
        )}
      </div>

      {(task.subtasks.length > 0 || task.progress > 0) && (
        <div className="card__progress-section">
          <div className="card__progress-header">
            <span className="card__progress-label">Progress</span>
            <span className="card__progress-value">{task.progress}%</span>
          </div>
          <ProgressBar value={task.progress} />
          {task.subtasks.length > 0 && (
            <p className="card__subtasks-summary">
              {completedSubs} / {task.subtasks.length} subtasks
            </p>
          )}
        </div>
      )}

      {task.dueDate && (
        <div style={{ marginTop: 'var(--sp-2)' }}>
          <span className={`card__date${dueOverdue ? ' card__date--overdue' : ''}`}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 1v4M11 1v4M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {dueOverdue ? 'Overdue · ' : ''}
            Due {formatDate(task.dueDate)}
          </span>
        </div>
      )}
    </div>
  );
};

/** Ghost card shown under the cursor while dragging */
export const TaskCardDragOverlay: React.FC<{ task: Task }> = ({ task }) => (
  <div className="card card--drag-overlay" style={{ width: 'var(--column-width)' }}>
    <div className="card__header">
      <span className="card__title">{task.title}</span>
    </div>
    {task.description && <p className="card__description">{task.description}</p>}
    <div className="card__meta">
      <PriorityBadge priority={task.priority} />
    </div>
  </div>
);
