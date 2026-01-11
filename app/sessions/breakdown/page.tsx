"use client";

import React, { useEffect, useRef, useState } from "react";
import AddSessionForm from "../../components/AddSessionForm";
import { useRouter, useSearchParams } from "next/navigation";

const AddSessionFormAny = AddSessionForm as any;

export default function SessionsBreakdownPage() {
  const searchParams = useSearchParams();
  const playerId = searchParams?.get("player_id") ?? null;
  const sessionId = searchParams?.get("session_id") ?? null;
  const router = useRouter();
  const formRef = useRef<any>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) return;
    (async () => {
      try {
        const res = await fetch('/api/players');
        const data = await res.json();
        const players = data?.players || [];
        const p = players.find((x: any) => String(x.id) === String(playerId));
        if (p) setPlayerName(((p.first_name || '') + ' ' + (p.last_name || '')).trim());
      } catch (e) {
        // ignore
      }
    })();
  }, [playerId]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 20 }}>
      <div style={{ position: 'relative', width: 393, height: 852, background: '#ffffff', padding: 12, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#000' }}>{playerName ? `View Session: ${playerName}` : 'View Session'}</div>
        </div>

        <div style={{ marginTop: 12 }}>
          <AddSessionFormAny
            ref={formRef}
            player={{ id: playerId as string | null }}
            sessionId={sessionId as string | null}
            hideDate
            hideNotes
            hideDelete
            showSaveButton={false}
            readOnly={true}
          />
        </div>

        <button
          onClick={() => { try { router.push('/'); } catch (e) { window.location.href = '/'; } }}
          style={{ position: 'absolute', left: 16, top: 794, padding: '8px 12px', background: '#000', color: '#fff', borderRadius: 8, border: 'none' }}
        >
          Back
        </button>
      </div>
    </div>
  );
}
