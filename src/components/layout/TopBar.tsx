import React, { useState, useRef } from 'react';
import type { FilterState, BoardState } from '../../types';
import { exportBoard, importBoard } from '../../storage/storage';

interface TopBarProps {
  filters: FilterState;
  onFilterChange: (f: FilterState) => void;
  onNewTask: () => void;
  onAddColumn: () => void;
  board: BoardState;
  onImport: (data: BoardState) => void;
  onReset: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  filters, onFilterChange, onNewTask, onAddColumn,
  board, onImport, onReset,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importBoard(file);
      onImport(data);
    } catch (err) {
      alert('Failed to import: ' + (err as Error).message);
    }
    e.target.value = '';
  };

  const totalTasks = board.tasks.length;
  const doneTasks = board.tasks.filter((t) => {
    const doneCol = board.columns.find((c) => c.title.toLowerCase().includes('done'));
    return doneCol && t.columnId === doneCol.id;
  }).length;

  return (
    <>
      <header className="topbar">
        {/* Brand */}
        <div className="topbar__brand">
          <div className="topbar__logo">K</div>
          <span className="topbar__title">TaskFlow</span>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--sp-4)',
          padding: '0 var(--sp-4)',
          borderLeft: '1px solid var(--border-subtle)',
          borderRight: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{totalTasks}</strong> tasks
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{doneTasks}</strong> done
          </span>
        </div>

        {/* Search */}
        <div className="topbar__search-wrapper">
          <div className="topbar__search">
            <svg className="topbar__search-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              className="topbar__search-input"
              placeholder="Search tasks…"
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="topbar__actions">
          <span className="topbar__filter-label">Priority</span>
          <select
            className="filter-select"
            value={filters.priority}
            onChange={(e) => onFilterChange({ ...filters, priority: e.target.value as FilterState['priority'] })}
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button className="btn btn--ghost btn--sm" onClick={onAddColumn} title="Add column">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              <rect x="9" y="2" width="5" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Column
          </button>

          <button className="btn btn--primary" onClick={onNewTask}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            New Task
          </button>

          {/* Settings dropdown */}
          <div className="dropdown-wrapper">
            <button className="settings-btn" onClick={() => setShowSettings(!showSettings)}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {showSettings && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => { exportBoard(board); setShowSettings(false); }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v9M4 8l4 4 4-4M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Export JSON
                </button>
                <button className="dropdown-item" onClick={() => { fileRef.current?.click(); setShowSettings(false); }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M8 14V5M4 8l4-4 4 4M2 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Import JSON
                </button>
                <div className="dropdown-divider" />
                <button className="dropdown-item dropdown-item--danger"
                  onClick={() => { setShowResetConfirm(true); setShowSettings(false); }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8a5 5 0 105-5H5M5 1L3 3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Reset board
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportChange}
      />

      {/* Reset confirmation */}
      {showResetConfirm && (
        <div className="confirm-dialog" onClick={() => setShowResetConfirm(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-box__icon">⚠️</div>
            <h3 className="confirm-box__title">Reset all data?</h3>
            <p className="confirm-box__text">
              This will delete all tasks and columns and restore the default board. This cannot be undone.
            </p>
            <div className="confirm-box__actions">
              <button className="btn btn--ghost" onClick={() => setShowResetConfirm(false)}>Cancel</button>
              <button className="btn btn--danger" onClick={() => { onReset(); setShowResetConfirm(false); }}>Reset</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
