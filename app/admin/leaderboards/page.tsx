import React from "react";
import Leaderboards from "../../components/Leaderboards/Leaderboards";
import Link from 'next/link';

export default function AdminLeaderboardsPage() {
  return (
    <main style={{ padding: 24, paddingBottom: 92 }}>
      <h1 style={{ marginTop: 0 }}>Leaderboards (Admin)</h1>
      <Leaderboards />

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', background: '#fff', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 9999, gap: 24 }}>
        <Link href="/">
          <button aria-label="Cards" title="Cards" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 20, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="14" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="1" y="2" width="24" height="14" rx="2" stroke="#111" strokeWidth="1.5" fill="none" />
                <rect x="5" y="6" width="10" height="6" rx="1" stroke="#111" strokeWidth="1" fill="#f7f7f7" />
              </svg>
            </div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Cards</div>
          </button>
        </Link>

        <Link href="/admin/leaderboards">
          <button aria-label="Leaderboards" title="Leaderboards" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 17h3v-7H3v7zM10 17h3v-12h-3v12zM17 17h3v-4h-3v4z" fill="#111"/></svg>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Leaderboards</div>
          </button>
        </Link>

        <Link href="/achievements">
          <button aria-label="Achievements" title="Achievements" type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.39 4.85L19 8.24l-3.2 2.98L16.79 16 12 13.77 7.21 16l1-4.78L5 8.24l4.61-1.39L12 2z" fill="#111"/></svg>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Achievements</div>
          </button>
        </Link>
      </div>
    </main>
  );
}
