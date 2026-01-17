 'use client';
import React from 'react';
import AddSessionForm from './AddSessionForm';

export default function AddSessionModal({ player, onClose, onCreated, asPage = false }: { player: any; onClose: () => void; onCreated?: () => void; asPage?: boolean }) {
  if (asPage) {
    return (
      <div style={{ minHeight: '100vh', padding: 20, background: 'var(--card-bg)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div style={{ width: 393, height: 853, boxSizing: 'border-box', overflowY: 'auto' }}>
          <AddSessionForm player={player} onClose={onClose} onCreated={onCreated} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'transparent', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 10000 }}>
      <div style={{ width: 393, height: 853, boxSizing: 'border-box', overflowY: 'auto' }}>
        <AddSessionForm player={player} onClose={onClose} onCreated={onCreated} />
      </div>
    </div>
  );
}