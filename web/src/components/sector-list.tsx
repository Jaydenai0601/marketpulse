'use client';

import { useState } from 'react';
import { scoreColor } from '@/lib/utils';
import { SentimentTag } from './sentiment-tag';
import './sector-list.css';

interface Sector {
  name: string;
  score: number;
  label: string;
  events: string;
}

export function SectorList({ sectors }: { sectors: Sector[] }) {
  const [open, setOpen] = useState(() => {
    const first = sectors.findIndex((s) => Math.abs(s.score) >= 3);
    return first >= 0 ? sectors[first].name : null;
  });

  return (
    <div>
      {sectors.map((s) => {
        const isOpen = open === s.name;
        const color = scoreColor(s.score);
        const barWidth = Math.min((Math.abs(s.score) / 5) * 100, 100);
        const events = (() => {
          try {
            return JSON.parse(s.events) as string[];
          } catch {
            return [];
          }
        })();

        return (
          <div key={s.name} className="sector-item" onClick={() => setOpen(isOpen ? null : s.name)}>
            <div className="sector-header">
              <div className="sector-left">
                <span className="sector-name">{s.name}</span>
                <span className="sector-score" style={{ color }}>{s.score > 0 ? `+${s.score}` : s.score}</span>
                <div className="sector-bar-wrap">
                  <div
                    className="sector-bar"
                    style={{
                      width: `${barWidth}%`,
                      background: color,
                      marginLeft: s.score < 0 ? 'auto' : 0,
                      marginRight: s.score < 0 ? 0 : 'auto',
                    }}
                  />
                </div>
                <SentimentTag label={s.label} />
              </div>
              <span className={`sector-chevron ${isOpen ? 'open' : ''}`}>▼</span>
            </div>
            <div className={`sector-detail ${isOpen ? 'open' : ''}`}>
              {events.length > 0 ? (
                events.map((ev, i) => (
                  <div key={i} className="sector-event">
                    {ev}
                  </div>
                ))
              ) : (
                <div className="sector-event">暂无事件摘要</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
