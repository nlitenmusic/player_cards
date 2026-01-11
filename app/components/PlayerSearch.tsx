"use client";
import React, { useEffect, useState, useRef } from "react";

export default function PlayerSearch({ players, onFiltered, placeholder = 'Search player' }: {
  players: any[];
  onFiltered: (p: any[]) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const raw = String(q || "").trim().toLowerCase();
      if (!raw) {
        onFiltered(players.slice());
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
      onFiltered(filtered);
    }, 160);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [q, players, onFiltered]);

  return (
    <div style={{ marginBottom: 12, width: '100%', position: 'relative' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9ca3af' }}>
        <circle cx="11" cy="11" r="6"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input
        placeholder={placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ width: '100%', padding: '8px 10px 8px 36px', borderRadius: 6, border: '1px solid #e5e7eb' }}
      />
    </div>
  );
}
