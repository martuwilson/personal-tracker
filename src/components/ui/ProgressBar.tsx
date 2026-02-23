import React from 'react';

interface ProgressBarProps {
  value: number; // 0–100
}

function getProgressClass(value: number): string {
  if (value === 0) return 'progress-bar__fill--0';
  if (value === 100) return 'progress-bar__fill--done';
  if (value >= 70) return 'progress-bar__fill--high';
  if (value >= 40) return 'progress-bar__fill--mid';
  return 'progress-bar__fill--low';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value }) => {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="progress-bar" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={`progress-bar__fill ${getProgressClass(clamped)}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
