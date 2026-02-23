import React, { useState, useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Task, FilterState } from '../../types';
import { Column } from '../column/Column';
import { TaskCardDragOverlay } from '../card/TaskCard';
import { useBoard } from '../../hooks/useBoard';

interface BoardProps {
  boardHook: ReturnType<typeof useBoard>;
  filters: FilterState;
  onOpenTask: (task: Task) => void;
  onAddColumnClick: () => void;
}

export const Board: React.FC<BoardProps> = ({ boardHook, filters, onOpenTask, onAddColumnClick }) => {
  const {
    board,
    addTask, deleteTask, updateColumn, deleteColumn,
    moveTask, reorderTasksInColumn,
  } = boardHook;

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const sortedColumns = [...board.columns].sort((a, b) => a.order - b.order);

  const getTasksForColumn = useCallback(
    (columnId: string) =>
      board.tasks
        .filter((t) => t.columnId === columnId)
        .sort((a, b) => a.order - b.order),
    [board.tasks]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;
    if (type === 'task') {
      setActiveTask(active.data.current?.task as Task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const type = active.data.current?.type;
    if (type !== 'task') return;

    const activeTaskId = active.id as string;
    const activeTask = board.tasks.find((t) => t.id === activeTaskId);
    if (!activeTask) return;

    // Dropped over a column or another task
    const overType = over.data.current?.type;

    if (overType === 'column') {
      const targetColumnId = over.data.current?.columnId as string;
      const targetTasks = getTasksForColumn(targetColumnId);
      moveTask(activeTaskId, targetColumnId, targetTasks.length);
      return;
    }

    if (overType === 'task') {
      const overTask = board.tasks.find((t) => t.id === over.id);
      if (!overTask) return;

      if (activeTask.columnId === overTask.columnId) {
        // Reorder within column
        const colTasks = getTasksForColumn(activeTask.columnId);
        const oldIndex = colTasks.findIndex((t) => t.id === activeTaskId);
        const newIndex = colTasks.findIndex((t) => t.id === over.id);
        if (oldIndex !== newIndex) {
          const reordered = arrayMove(colTasks, oldIndex, newIndex);
          reorderTasksInColumn(activeTask.columnId, reordered.map((t) => t.id));
        }
      } else {
        // Move to different column at the over-task's position
        const targetTasks = getTasksForColumn(overTask.columnId);
        const targetIndex = targetTasks.findIndex((t) => t.id === overTask.id);
        moveTask(activeTaskId, overTask.columnId, targetIndex);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="board-wrapper">
        <div className="board">
          {sortedColumns.map((col) => (
            <Column
              key={col.id}
              column={col}
              tasks={getTasksForColumn(col.id)}
              filters={filters}
              onAddTask={addTask}
              onOpenTask={onOpenTask}
              onDeleteTask={deleteTask}
              onDeleteColumn={deleteColumn}
              onUpdateColumn={updateColumn}
            />
          ))}

          {/* Add Column button */}
          <button className="add-column-btn" onClick={onAddColumnClick}>
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New Column
          </button>
        </div>
      </div>

      <DragOverlay>
        {activeTask && <TaskCardDragOverlay task={activeTask} />}
      </DragOverlay>
    </DndContext>
  );
};
