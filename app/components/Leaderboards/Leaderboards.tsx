"use client";
import React, { useEffect, useState } from "react";
import LeaderboardTable from "./LeaderboardTable";
import { SKILL_LABELS, SKILL_KEYS, CPAST } from "../../lib/skills";
import { macroTiers } from "../../lib/tiers";


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
    <div style={{ marginTop: 16, maxWidth: 393, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Skill:</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select value={skill} onChange={(e)=>setSkill(e.target.value)} style={{ minWidth: 160 }}>
              {SKILL_KEYS.map((k,i)=> <option key={k} value={k}>{SKILL_LABELS[i]}</option>)}
            </select>
            <span style={{ color: '#6b7280' }}>▾</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Component:</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select value={comp} onChange={(e)=>setComp(e.target.value)} style={{ minWidth: 160 }}>
              <option value="overall">Overall</option>
              {CPAST.map(c=> <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <span style={{ color: '#6b7280' }}>▾</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Tier:</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select value={tier} onChange={(e)=>setTier(e.target.value)} style={{ minWidth: 160 }}>
              <option value="">All</option>
              {macroTiers.map((m)=> <option key={m.name} value={m.name.toLowerCase()}>{m.name}</option>)}
            </select>
            <span style={{ color: '#6b7280' }}>▾</span>
          </div>
        </div>
      </div>

      {
        (() => {
          const idx = SKILL_KEYS.indexOf(skill);
          const skillLabel = idx >= 0 ? SKILL_LABELS[idx] : (skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase());
          const compObj = CPAST.find(c => c.key === comp);
          const compLabel = compObj ? (compObj.label.charAt(0).toUpperCase() + compObj.label.slice(1)) : (comp.charAt(0).toUpperCase() + comp.slice(1).toLowerCase());
          const title = `${skillLabel}: ${compLabel}`;
          return <LeaderboardTable skill={skill} component={comp} entries={entries} title={title} />;
        })()
      }
    </div>
  );
}
