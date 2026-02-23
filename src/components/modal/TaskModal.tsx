import React, { useState, useEffect, useRef } from 'react';
import type { Task, Priority, ProgressMode, Subtask } from '../../types';
import { ProgressBar } from '../ui/ProgressBar';

interface TaskModalProps {
  task: Task;
  onUpdate: (id: string, changes: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onUpdateSubtask: (taskId: string, subtaskId: string, title: string) => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  task, onUpdate, onDelete, onClose,
  onAddSubtask, onToggleSubtask, onDeleteSubtask, onUpdateSubtask,
}) => {
  const [localTask, setLocalTask] = useState<Task>(task);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync when external task changes (e.g., subtask toggle from another place)
  useEffect(() => { setLocalTask(task); }, [task]);

  const patch = (changes: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    const updated = { ...localTask, ...changes };
    setLocalTask(updated);
    onUpdate(task.id, changes);
  };

  const handleProgressModeToggle = () => {
    const newMode: ProgressMode = localTask.progressMode === 'manual' ? 'auto' : 'manual';
    patch({ progressMode: newMode });
  };

  const handleAddSubtask = () => {
    const val = newSubtaskTitle.trim();
    if (!val) return;
    onAddSubtask(task.id, val);
    setNewSubtaskTitle('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/,/g, '');
      if (!localTask.tags.includes(newTag)) {
        patch({ tags: [...localTask.tags, newTag] });
      }
      setTagInput('');
    }
    if (e.key === 'Backspace' && !tagInput && localTask.tags.length > 0) {
      patch({ tags: localTask.tags.slice(0, -1) });
    }
  };

  const removeTag = (tag: string) => {
    patch({ tags: localTask.tags.filter((t) => t !== tag) });
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleDeleteConfirm = () => {
    onDelete(task.id);
    onClose();
  };

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const completedSubs = localTask.subtasks.filter((s) => s.completed).length;

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal-panel" role="dialog" aria-label={`Edit task: ${localTask.title}`}>

        {/* ── Header ──────────────────────────────────── */}
        <div className="modal-header">
          <div className="modal-header__left">
            <span className="modal-header__subtitle">Task</span>
            <input
              className="modal-title-input"
              value={localTask.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="Task title"
            />
          </div>
          <button className="btn btn--icon" onClick={onClose} aria-label="Close panel"
            style={{ flexShrink: 0, marginTop: 4 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── Body ────────────────────────────────────── */}
        <div className="modal-body">

          {/* Description */}
          <div className="modal-section">
            <span className="modal-section__label">Description</span>
            <textarea
              className="field__textarea"
              rows={3}
              placeholder="Add a description…"
              value={localTask.description}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </div>

          {/* Priority + Status row */}
          <div className="modal-row">
            <div className="field">
              <label className="field__label">Priority</label>
              <div className="priority-tabs">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`priority-tab${localTask.priority === opt.value ? ` priority-tab--active-${opt.value}` : ''}`}
                    onClick={() => patch({ priority: opt.value })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dates row */}
          <div className="modal-row">
            <div className="field">
              <label className="field__label">Start Date</label>
              <input
                type="date"
                className="field__input"
                value={localTask.startDate ?? ''}
                onChange={(e) => patch({ startDate: e.target.value || null })}
              />
            </div>
            <div className="field">
              <label className="field__label">Due Date</label>
              <input
                type="date"
                className="field__input"
                value={localTask.dueDate ?? ''}
                onChange={(e) => patch({ dueDate: e.target.value || null })}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="field">
            <label className="field__label">Tags</label>
            <div className="tags-input-wrapper">
              {localTask.tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  {tag}
                  <button className="tag-chip__remove" onClick={() => removeTag(tag)} type="button">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                </span>
              ))}
              <input
                className="tags-input"
                placeholder={localTask.tags.length === 0 ? 'Add tag, press Enter…' : ''}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
            </div>
          </div>

          {/* Progress */}
          <div className="modal-section">
            <div className="toggle-row" style={{ marginBottom: 'var(--sp-3)' }}>
              <span className="modal-section__label">Progress</span>
              <div className="toggle-row">
                <span className="toggle-row__label" style={{ fontSize: 'var(--text-xs)' }}>
                  Auto from subtasks
                </span>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={localTask.progressMode === 'auto'}
                    onChange={handleProgressModeToggle}
                  />
                  <span className="toggle__track" />
                </label>
              </div>
            </div>

            {localTask.progressMode === 'manual' ? (
              <div className="progress-slider-wrapper">
                <input
                  type="range"
                  className="progress-slider"
                  min={0}
                  max={100}
                  step={5}
                  value={localTask.progress}
                  onChange={(e) => patch({ progress: Number(e.target.value) })}
                />
                <span className="progress-value-badge">{localTask.progress}%</span>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 'var(--sp-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {completedSubs} / {localTask.subtasks.length} subtasks
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {localTask.progress}%
                  </span>
                </div>
                <ProgressBar value={localTask.progress} />
              </div>
            )}
          </div>

          {/* Subtasks */}
          <div className="modal-section">
            <span className="modal-section__label">Subtasks</span>
            <div className="subtask-list">
              {task.subtasks.map((sub) => (
                <SubtaskItem
                  key={sub.id}
                  subtask={sub}
                  onToggle={() => onToggleSubtask(task.id, sub.id)}
                  onDelete={() => onDeleteSubtask(task.id, sub.id)}
                  onUpdate={(title) => onUpdateSubtask(task.id, sub.id, title)}
                />
              ))}
              {/* New subtask input row */}
              <div className="subtask-add-row">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                  <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  className="subtask-add-input"
                  placeholder="Add subtask…"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                />
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--sp-4)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Created {new Date(task.createdAt).toLocaleString()}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Updated {new Date(task.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────── */}
        <div className="modal-footer">
          <button
            className="btn btn--danger btn--sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9h8l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Delete
          </button>
          <div className="modal-footer__right">
            <button className="btn btn--ghost btn--sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="confirm-dialog" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-box__icon">🗑️</div>
            <h3 className="confirm-box__title">Delete task?</h3>
            <p className="confirm-box__text">
              "<strong>{task.title}</strong>" will be permanently deleted.
            </p>
            <div className="confirm-box__actions">
              <button className="btn btn--ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn--danger" onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── SubtaskItem ──────────────────────────────────────────── */
interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (title: string) => void;
}

const SubtaskItem: React.FC<SubtaskItemProps> = ({ subtask, onToggle, onDelete, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(subtask.title);

  const commit = () => {
    const trimmed = val.trim();
    if (trimmed) onUpdate(trimmed);
    else setVal(subtask.title);
    setEditing(false);
  };

  return (
    <div className="subtask-item">
      <input
        type="checkbox"
        className="subtask-item__checkbox"
        checked={subtask.completed}
        onChange={onToggle}
      />
      {editing ? (
        <input
          className={`subtask-item__text${subtask.completed ? ' subtask-item__text--done' : ''}`}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          autoFocus
        />
      ) : (
        <span
          className={`subtask-item__text${subtask.completed ? ' subtask-item__text--done' : ''}`}
          style={{ cursor: 'text' }}
          onDoubleClick={() => setEditing(true)}
        >
          {subtask.title}
        </span>
      )}
      <button className="btn btn--icon subtask-item__delete" onClick={onDelete}
        style={{ width: 22, height: 22 }}>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
};
