import React, { useState, useCallback } from 'react';
import './styles/theme.css';
import { useBoard } from './hooks/useBoard';
import { TopBar } from './components/layout/TopBar';
import { Board } from './components/layout/Board';
import { TaskModal } from './components/modal/TaskModal';
import { AddColumnModal } from './components/column/AddColumnModal';
import type { Task, FilterState, BoardState } from './types';

function App() {
  const boardHook = useBoard();
  const { board, addTask, updateTask, deleteTask, addSubtask, toggleSubtask, deleteSubtask, updateSubtask, addColumn, resetBoard, loadImported } = boardHook;

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ search: '', priority: 'all' });

  const handleOpenTask = useCallback((task: Task) => {
    setActiveTask(task);
  }, []);

  // Keep modal in sync with board state
  const modalTask = activeTask ? board.tasks.find((t) => t.id === activeTask.id) ?? activeTask : null;

  const handleNewTask = () => {
    const firstCol = [...board.columns].sort((a, b) => a.order - b.order)[0];
    if (!firstCol) return;
    addTask(firstCol.id, 'New Task');
    setTimeout(() => {
      const latest = boardHook.board.tasks
        .filter((t) => t.columnId === firstCol.id)
        .sort((a, b) => b.order - a.order)[0];
      if (latest) setActiveTask(latest);
    }, 80);
  };

  return (
    <div className="app">
      <TopBar
        filters={filters}
        onFilterChange={setFilters}
        onNewTask={handleNewTask}
        onAddColumn={() => setShowAddColumn(true)}
        board={board}
        onImport={(data: BoardState) => loadImported(data)}
        onReset={resetBoard}
      />
      <Board
        boardHook={boardHook}
        filters={filters}
        onOpenTask={handleOpenTask}
        onAddColumnClick={() => setShowAddColumn(true)}
      />
      {modalTask && (
        <TaskModal
          task={modalTask}
          onUpdate={updateTask}
          onDelete={(id) => { deleteTask(id); setActiveTask(null); }}
          onClose={() => setActiveTask(null)}
          onAddSubtask={addSubtask}
          onToggleSubtask={toggleSubtask}
          onDeleteSubtask={deleteSubtask}
          onUpdateSubtask={updateSubtask}
        />
      )}
      {showAddColumn && (
        <AddColumnModal
          onConfirm={(title, color) => addColumn(title, color)}
          onClose={() => setShowAddColumn(false)}
        />
      )}
    </div>
  );
}

export default App;
