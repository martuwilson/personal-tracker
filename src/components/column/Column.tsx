import React, { useState, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Column as ColumnType, Task, FilterState } from '../../types';
import { TaskCard } from '../card/TaskCard';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  filters: FilterState;
  onAddTask: (columnId: string, title: string) => void;
  onOpenTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onDeleteColumn: (id: string) => void;
  onUpdateColumn: (id: string, changes: Partial<Pick<ColumnType, 'title' | 'color'>>) => void;
}

const COLUMN_COLORS = [
  '#4a9eff', '#9c8eff', '#4ade80', '#fbbf24', '#f87171',
  '#38bdf8', '#fb7185', '#a78bfa', '#34d399', '#f97316',
];

function applyFilters(tasks: Task[], filters: FilterState): Task[] {
  let result = [...tasks];
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    );
  }
  if (filters.priority !== 'all') {
    result = result.filter((t) => t.priority === filters.priority);
  }
  return result.sort((a, b) => a.order - b.order);
}

export const Column: React.FC<ColumnProps> = ({
  column, tasks, filters, onAddTask, onOpenTask, onDeleteTask, onDeleteColumn, onUpdateColumn,
}) => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddValue, setQuickAddValue] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const quickAddRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', columnId: column.id },
  });

  const filteredTasks = applyFilters(tasks, filters);
  const taskIds = filteredTasks.map((t) => t.id);

  const handleQuickAddSubmit = (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return;
    const val = quickAddValue.trim();
    if (val) {
      onAddTask(column.id, val);
      setQuickAddValue('');
      setShowQuickAdd(false);
    }
  };

  const handleQuickAddBlur = () => {
    if (!quickAddValue.trim()) {
      setShowQuickAdd(false);
    }
  };

  const handleTitleSubmit = () => {
    const val = titleValue.trim();
    if (val && val !== column.title) {
      onUpdateColumn(column.id, { title: val });
    } else {
      setTitleValue(column.title);
    }
    setIsEditingTitle(false);
  };

  const handleDeleteConfirm = () => {
    setShowConfirm(false);
    onDeleteColumn(column.id);
  };

  return (
    <>
      <div className={`column${isOver ? ' column--dragging-over' : ''}`}>
        {/* Header */}
        <div className="column__header">
          <div className="column__header-left">
            <span className="column__dot" style={{ backgroundColor: column.color }} />
            {isEditingTitle ? (
              <input
                className="column-title-input"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
              />
            ) : (
              <span
                className="column__title"
                onDoubleClick={() => setIsEditingTitle(true)}
                title="Double-click to rename"
              >
                {column.title}
              </span>
            )}
            <span className="column__count">{tasks.length}</span>
          </div>

          <div className="column__header-actions">
            <div className="dropdown-wrapper" ref={menuRef}>
              <button
                className="btn btn--icon"
                title="Column options"
                onClick={() => setShowMenu(!showMenu)}
                style={{ width: 26, height: 26 }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="3" r="1.2" fill="currentColor" />
                  <circle cx="8" cy="8" r="1.2" fill="currentColor" />
                  <circle cx="8" cy="13" r="1.2" fill="currentColor" />
                </svg>
              </button>

              {showMenu && (
                <div className="dropdown-menu">
                  <button
                    className="dropdown-item"
                    onClick={() => { setIsEditingTitle(true); setShowMenu(false); }}
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M11.5 2.5a2.12 2.12 0 013 3L5 15H1v-4L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                    Rename
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => { setShowColorPicker(!showColorPicker); setShowMenu(false); }}
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="5.5" cy="6" r="1" fill="currentColor" />
                      <circle cx="10.5" cy="6" r="1" fill="currentColor" />
                      <circle cx="8" cy="9.5" r="1" fill="currentColor" />
                    </svg>
                    Change color
                  </button>
                  <div className="dropdown-divider" />
                  <button
                    className="dropdown-item dropdown-item--danger"
                    onClick={() => { setShowConfirm(true); setShowMenu(false); }}
                  >
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9h8l1-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Delete column
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Color picker inline */}
        {showColorPicker && (
          <div style={{ padding: 'var(--sp-3) var(--column-padding)', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="color-picker-row">
              {COLUMN_COLORS.map((c) => (
                <button
                  key={c}
                  className={`color-swatch${column.color === c ? ' color-swatch--active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => { onUpdateColumn(column.id, { color: c }); setShowColorPicker(false); }}
                  title={c}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quick Add field above card list */}
        {showQuickAdd && (
          <div className="quick-add">
            <input
              ref={quickAddRef}
              className="quick-add__input"
              placeholder="Task title…"
              value={quickAddValue}
              onChange={(e) => setQuickAddValue(e.target.value)}
              onKeyDown={handleQuickAddSubmit}
              onBlur={handleQuickAddBlur}
              autoFocus
            />
            <p className="quick-add__hint">↵ Enter to add · Esc to cancel</p>
          </div>
        )}

        {/* Cards */}
        <div
          ref={setNodeRef}
          className={`column__body${filteredTasks.length === 0 && !showQuickAdd ? ' column__body--empty' : ''}`}
        >
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onOpen={onOpenTask}
                onDelete={onDeleteTask}
              />
            ))}
          </SortableContext>

          {filteredTasks.length === 0 && !showQuickAdd && (
            <div className="column__empty">
              <div className="column__empty-icon">📋</div>
              <p className="column__empty-text">No tasks yet</p>
            </div>
          )}
        </div>

        {/* Footer add button */}
        <div className="column__footer">
          <button
            className="column__add-btn"
            onClick={() => {
              setShowQuickAdd(true);
              setTimeout(() => quickAddRef.current?.focus(), 50);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add task
          </button>
        </div>
      </div>

      {/* Delete Confirm */}
      {showConfirm && (
        <div className="confirm-dialog" onClick={() => setShowConfirm(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-box__icon">🗑️</div>
            <h3 className="confirm-box__title">Delete column?</h3>
            <p className="confirm-box__text">
              This will permanently delete <strong>"{column.title}"</strong> and all {tasks.length} task{tasks.length !== 1 ? 's' : ''} inside it.
            </p>
            <div className="confirm-box__actions">
              <button className="btn btn--ghost" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn--danger" onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
