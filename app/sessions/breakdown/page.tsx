import React from "react";
import AddSessionForm from "../../components/AddSessionForm";

const AddSessionFormAny = AddSessionForm as any;

export default function SessionsBreakdownPage({ searchParams }: { searchParams?: { player_id?: string; session_id?: string } }) {
  const playerId = searchParams?.player_id ?? null;
  const sessionId = searchParams?.session_id ?? null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 20 }}>
      <div style={{ position: 'relative', width: 393, height: 852, background: '#ffffff', padding: 12, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#000' }}>View Session</div>
        </div>

        <div style={{ marginTop: 12 }}>
          <AddSessionFormAny
            player={{ id: playerId as string | null }}
            sessionId={sessionId as string | null}
            hideDate
            hideNotes
            hideDelete
            showSaveButton={false}
            readOnly={true}
          />
        </div>

        <a href="/" style={{ position: 'absolute', left: 16, top: 794, padding: '8px 12px', background: '#000', color: '#fff', borderRadius: 8, border: 'none', display: 'inline-block', textDecoration: 'none' }}>Back</a>
      </div>
    </div>
  );
}
