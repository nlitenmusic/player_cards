 'use client';
import React from 'react';
import AddSessionForm from './AddSessionForm';

export default function AddSessionModal({ player, onClose, onCreated, asPage = false }: { player: any; onClose: () => void; onCreated?: () => void; asPage?: boolean }) {
  if (asPage) {
    return (
      <div style={{ minHeight: '100vh', padding: 20, background: 'transparent' }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 20 }}>
          <AddSessionForm player={player} onClose={onClose} onCreated={onCreated} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <AddSessionForm player={player} onClose={onClose} onCreated={onCreated} />
    </div>
  );
}