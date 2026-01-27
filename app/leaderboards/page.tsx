import React from "react";
import Leaderboards from "../components/Leaderboards/Leaderboards";
import Link from 'next/link';

export default function LeaderboardsPage() {
  return (
    <main style={{ width: 393, margin: '0 auto', padding: '60px 12px 92px', boxSizing: 'border-box' }}>
      <h1 style={{ marginTop: 0 }}>Leaderboards</h1>
      <Leaderboards />

      <div id="bottomNav" className="bottom-nav" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', background: '#fff', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 9999, boxSizing: 'border-box' }}>
        <div style={{ width: 393, display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 8 }}>
          <Link href="/" aria-label="Cards" title="Cards" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'inherit' }}>
            <div style={{ width: 20, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="14" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <rect x="1" y="2" width="24" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <rect x="5" y="6" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="1" fill="currentColor" />
              </svg>
            </div>
            <div style={{ fontSize: 11, color: 'inherit' }}>Cards</div>
          </Link>

          <Link href="/leaderboards" aria-label="Leaderboards" title="Leaderboards" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'inherit' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 17h3v-7H3v7zM10 17h3v-12h-3v12zM17 17h3v-4h-3v4z" fill="currentColor"/></svg>
            <div style={{ fontSize: 11, color: 'inherit' }}>Leaderboards</div>
          </Link>

          <Link href="/achievements" aria-label="Achievements" title="Achievements" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textDecoration: 'none', color: 'inherit' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.39 4.85L19 8.24l-3.2 2.98L16.79 16 12 13.77 7.21 16l1-4.78L5 8.24l4.61-1.39L12 2z" fill="currentColor"/></svg>
            <div style={{ fontSize: 11, color: 'inherit' }}>Achievements</div>
          </Link>
        </div>
      </div>
    </main>
  );
}
