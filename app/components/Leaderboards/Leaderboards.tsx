"use client";
import React, { useEffect, useState } from "react";
import LeaderboardTable from "./LeaderboardTable";
import { SKILL_LABELS, SKILL_KEYS, CPAST } from "../../lib/skills";
import { macroTiers } from "../../lib/tiers";

type ReferenceKeyProps = {
  skill: string;
  component: string;
};

function ReferenceKey({ skill, component }: ReferenceKeyProps) {
  return (
    <div style={{ marginBottom: 12 }}>
      <strong>Reference:</strong> {skill.toUpperCase()} — {component.toUpperCase()}
    </div>
  );
}

export default function Leaderboards() {
  const [entries, setEntries] = useState<any[]>([]);
  const [skill, setSkill] = useState<string>(SKILL_KEYS[0]);
  const [comp, setComp] = useState<string>('c');
  const [tier, setTier] = useState<string>('');
  async function load() {
    try {
      const params = new URLSearchParams({ skill, comp });
      if (tier) params.set('tier', tier);
      const res = await fetch(`/api/admin/leaderboards?${params.toString()}`);
      const json = await res.json();
      setEntries(json.entries || []);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => { load(); }, [skill, comp, tier]);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
        <div>
          <strong>Skill:</strong>
          <select value={skill} onChange={(e)=>setSkill(e.target.value)} style={{ marginLeft: 8 }}>
            {SKILL_KEYS.map((k,i)=> <option key={k} value={k}>{SKILL_LABELS[i]}</option>)}
          </select>
        </div>

        <div>
          <strong>Component:</strong>
          <select value={comp} onChange={(e)=>setComp(e.target.value)} style={{ marginLeft: 8 }}>
            {CPAST.map(c=> <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <strong>Tier:</strong>
          <select value={tier} onChange={(e)=>setTier(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">All</option>
            {macroTiers.map((m)=> <option key={m.name} value={m.name.toLowerCase()}>{m.name}</option>)}
          </select>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <button onClick={load} style={{ padding: '6px 10px' }}>Refresh</button>
        </div>
      </div>

      <ReferenceKey skill={skill} component={comp} />
      <LeaderboardTable skill={skill} component={comp} entries={entries} title={`${skill.toUpperCase()} — ${comp.toUpperCase()}${tier ? ' — ' + tier : ''}`} />
    </div>
  );
}
