import React from 'react';
import type { Priority } from '../../types';

interface PriorityBadgeProps {
  priority: Priority;
}

const LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => (
  <span className={`badge badge--priority-${priority}`}>
    <span className="badge__dot" style={{ backgroundColor: 'currentColor' }} />
    {LABELS[priority]}
  </span>
);

interface TagBadgeProps {
  tag: string;
  onRemove?: () => void;
}

export const TagBadge: React.FC<TagBadgeProps> = ({ tag, onRemove }) => (
  <span className="badge badge--tag">
    {tag}
    {onRemove && (
      <button className="tag-chip__remove" onClick={onRemove} type="button">
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    )}
  </span>
);
