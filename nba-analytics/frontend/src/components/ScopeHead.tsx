import React from 'react'

/* Section divider with a title + scope badge (e.g. "This Season · 2022-23"). */
export const ScopeHead: React.FC<{ title: string; badge: string; now?: boolean }> = ({ title, badge, now }) => (
  <div className="scope-head">
    <h2>{title}</h2>
    <span className={`scope-badge ${now ? 'now' : ''}`}>{badge}</span>
    <span className="line" />
  </div>
)
