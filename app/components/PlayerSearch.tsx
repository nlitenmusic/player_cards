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
  const [favoriteFilter, setFavoriteFilter] = useState<string>('All');
  const timer = useRef<number | null>(null);
  const FAVORITES_KEY = 'pc_admin_favorites_v1';
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const onFilteredRef = useRef(onFiltered);

  // keep a stable ref to the onFiltered prop to avoid changing deps
  useEffect(() => { onFilteredRef.current = onFiltered; }, [onFiltered]);

  // helper to load favorites set
  function loadFavoritesSet() {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(FAVORITES_KEY) : null;
      const favs = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(favs) ? favs.map((x:any)=>String(x)) : []);
    } catch (e) {
      return new Set();
    }
  }

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const raw = String(q || "").trim().toLowerCase();
      const base = players.slice();
      const tierFiltered = tier && tier !== 'All' ? base.filter((p)=>getMacroTier(Number(p?.avg_rating ?? 0)).name === tier) : base;
      // apply favorite filter when no search query
      if (!raw) {
        const favSet = loadFavoritesSet();
        let out = tierFiltered;
        if (variant === 'admin' && favoriteFilter === 'Favorited') {
          out = out.filter((p)=> favSet.has(String(p?.id ?? p?.playerId ?? p?.player_id ?? '')));
        }
        onFilteredRef.current(out);
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
      // When searching by query, always search across all tiers (ignore tier selector)
      const favSet2 = loadFavoritesSet();
      const out = (variant === 'admin' && favoriteFilter === 'Favorited') ? filtered.filter((p)=> favSet2.has(String(p?.id ?? p?.playerId ?? p?.player_id ?? ''))) : filtered;
      onFilteredRef.current(out);
    }, 160);
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  // depend on players.length instead of players to keep the dependency
  // array size stable and avoid deep object comparisons
  }, [q, players.length, tier, favoriteFilter, variant, refreshKey]);

  // respond to favorites changed from PlayerCard
  useEffect(() => {
    function onFavChange() { setRefreshKey((k)=>k+1); }
    try { window.addEventListener('pc_favorites_changed', onFavChange); } catch (e) {}
    return () => { try { window.removeEventListener('pc_favorites_changed', onFavChange); } catch (e) {} };
  }, []);

  const cls = `player-search${variant === 'admin' ? ' player-search--admin' : ''}`;

  // derive which macro tiers actually have players so empty tiers aren't shown
  const presentTierNames = new Set<string>();
  players.forEach((p) => {
    try {
      const t = getMacroTier(Number(p?.avg_rating ?? 0));
      if (t?.name) presentTierNames.add(t.name);
    } catch (err) {
      // ignore
    }
  });
  const visibleMacroTiers = macroTiers.filter((t) => presentTierNames.has(t.name));

  return (
    <div className={cls} style={{ marginBottom: 12, width: '100%', paddingTop: 6, paddingBottom: 6 }}>
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

        
        <div style={{ width: variant === 'admin' ? 320 : 160, display: 'flex', alignItems: 'center', gap: 8 }}>
          <select value={tier} onChange={(e)=>setTier(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 6, boxSizing: 'border-box' }} aria-label="Filter by tier">
            <option value="All">All tiers</option>
            {visibleMacroTiers.map((t)=> (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
          {variant === 'admin' && (
            <select value={favoriteFilter} onChange={(e)=>setFavoriteFilter(e.target.value)} style={{ width: 140, padding: '8px', borderRadius: 6, boxSizing: 'border-box' }} aria-label="Filter by favorite">
              <option value="All">All players</option>
              <option value="Favorited">Favorited</option>
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
