"use client";
import React, { useEffect, useState, useRef } from "react";
import { getMacroTier, macroTiers } from "../lib/tiers";

export default function PlayerSearch({ players, onFiltered, placeholder = 'Search player', variant }: {
  players: any[];
  onFiltered: (p: any[]) => void;
  placeholder?: string;
  variant?: 'default' | 'admin';
}) {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<string>('All');
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const raw = String(q || "").trim().toLowerCase();
      if (!raw) {
        const base = players.slice();
        const out = tier && tier !== 'All' ? base.filter((p)=>getMacroTier(Number(p?.avg_rating ?? 0)).name === tier) : base;
        onFiltered(out);
        return;
      }
      const parts = raw.split(/\s+/).filter(Boolean);
      const filtered = players.filter((p) => {
        const first = String(p.first_name || "").toLowerCase();
        const last = String(p.last_name || "").toLowerCase();
        const fullname = `${first} ${last}`.trim();
        const id = String(p.id || "");
        // match id
        if (id.includes(raw)) return true;
        // match any token against first, last, or full
        return parts.every((tok) => fullname.includes(tok) || first.includes(tok) || last.includes(tok));
      });
      const out = tier && tier !== 'All' ? filtered.filter((p)=>getMacroTier(Number(p?.avg_rating ?? 0)).name === tier) : filtered;
      onFiltered(out);
    }, 160);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [q, players, onFiltered]);

  const cls = `player-search${variant === 'admin' ? ' player-search--admin' : ''}`;

  return (
    <div className={cls} style={{ marginBottom: 12, width: '100%', position: 'sticky', top: 0, zIndex: 40, paddingTop: 6, paddingBottom: 6 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="player-search__icon" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16 }}>
            <circle cx="11" cy="11" r="6"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            placeholder={placeholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: '100%', padding: '8px 10px 8px 36px', borderRadius: 6, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ width: 160, display: 'flex', alignItems: 'center' }}>
          <select value={tier} onChange={(e)=>setTier(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 6, boxSizing: 'border-box' }} aria-label="Filter by tier">
            <option value="All">All tiers</option>
            {macroTiers.map((t)=> (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
