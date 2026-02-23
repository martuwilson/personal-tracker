import React, { useState } from 'react';

interface AddColumnModalProps {
  onConfirm: (title: string, color: string) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#4a9eff', '#9c8eff', '#4ade80', '#fbbf24', '#f87171',
  '#38bdf8', '#fb7185', '#a78bfa', '#34d399', '#f97316',
];

export const AddColumnModal: React.FC<AddColumnModalProps> = ({ onConfirm, onClose }) => {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const handleSubmit = () => {
    const val = title.trim();
    if (!val) return;
    onConfirm(val, color);
    onClose();
  };

  return (
    <div className="add-column-modal" onClick={onClose}>
      <div className="add-column-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="add-column-box__title">New Column</h3>
        <div className="add-column-box__fields">
          <div className="field">
            <label className="field__label">Column name</label>
            <input
              className="field__input"
              placeholder="e.g. Review, Testing…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          </div>
          <div className="field">
            <label className="field__label">Color</label>
            <div className="color-picker-row">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  className={`color-swatch${color === c ? ' color-swatch--active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  type="button"
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="add-column-box__actions">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={!title.trim()}>
            Create column
          </button>
        </div>
      </div>
    </div>
  );
};
