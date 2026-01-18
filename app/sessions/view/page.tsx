import React from "react";
import ViewSessionPageClient from "./ViewSessionPageClient";

export default async function SessionsViewPage({ searchParams }: { searchParams?: any }) {
  const sp = await (searchParams as Promise<any> | any);
  const playerId = sp?.player_id ?? null;
  const sessionId = sp?.session_id ?? null;

  // Render the client-side sessions view centered; keep layout simple
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div>
        <ViewSessionPageClient playerId={playerId as string | null} initialSessionId={sessionId as string | null} />
      </div>
    </div>
  );
}

