'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import AddSessionModal from '../../../components/AddSessionModal';

export default function NewPlayerPage() {
  const router = useRouter();
  const handleClose = () => { try { router.push('/admin'); } catch (e) { window.location.href = '/admin'; } };
  const handleCreated = () => { try { router.push('/admin'); } catch (e) { window.location.href = '/admin'; } };
  const player = { id: null, first_name: '', last_name: '' };

  return (
    <div style={{ padding: 20, position: 'relative' }}>
      <button
        aria-label="Close"
        onClick={handleClose}
        style={{ position: 'absolute', right: 12, top: 12, padding: '6px 10px', fontSize: 16, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}
      >
        ✕
      </button>
      <h2>Add New Player</h2>
      <AddSessionModal player={player} onClose={handleClose} onCreated={handleCreated} asPage={true} />
    </div>
  );
}
