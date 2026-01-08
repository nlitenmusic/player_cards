import React from "react";
import AddSessionPageClient from "./AddSessionPageClient";

export default async function Page({ searchParams }: { searchParams?: Promise<{ [key: string]: string | string[] }> | { [key: string]: string | string[] } }) {
  const sp = await (searchParams as any);
  const playerId = Array.isArray(sp?.player_id) ? sp?.player_id[0] : sp?.player_id;
  return <AddSessionPageClient playerId={playerId ?? null} />;
}
