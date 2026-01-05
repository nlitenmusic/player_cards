"use client";
import React, { useEffect, useState, useRef } from "react";

export default function PlayerSearch({ players, onFiltered, placeholder = 'Search players by name or id…' }: {
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
    <div style={{ marginBottom: 12, width: '100%' }}>
      <input
        placeholder={placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }}
      />
    </div>
  );
}
