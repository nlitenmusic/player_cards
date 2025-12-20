// Small runtime schema helper — keep in sync with .db-schema.json
export const dbSchema = {
  tables: {
    players: ["id","first_name","last_name","sessions_count","avg_rating","row_averages","created_at","updated_at"],
    sessions: ["id","player_id","session_date","notes","created_at"],
    session_stats: ["id","session_id","skill_type","c","p","a","s","t","created_at"],
  }
};

export function allowedColumns(table: string): string[] {
  return (dbSchema as any).tables[table] ?? [];
}

export function sanitizeRows(table: string, rows: any[]): any[] {
  const allowed = new Set(allowedColumns(table));
  return (rows || []).map((r: any) => {
    const out: Record<string, any> = {};
    for (const k of Object.keys(r || {})) {
      if (allowed.has(k)) out[k] = r[k];
    }
    return out;
  });
}
