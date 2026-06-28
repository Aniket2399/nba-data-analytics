import React from 'react'

/* A single stat tile: label, big value, optional note and signed delta. */
export const Kpi: React.FC<{ lab: string; val: string; note?: string; delta?: number }> = ({ lab, val, note, delta }) => (
  <div className="stat">
    <div className="lab">{lab}</div>
    <div className="val">{val}</div>
    {note && <div className="note">{note}</div>}
    {delta !== undefined && <div className="note" style={{ color: delta >= 0 ? '#5fd49a' : '#f08a8a' }}>{delta >= 0 ? '+' : ''}{delta.toFixed(1)}</div>}
  </div>
)
