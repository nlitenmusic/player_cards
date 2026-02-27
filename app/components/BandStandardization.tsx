"use client";
import React, { useState } from 'react';

function BandBadge({ name }: { name: string }) {
  const colors: Record<string, string> = {
    Unstable: '#ef4444',
    Conditional: '#f97316',
    Functional: '#eab308',
    Competitive: '#84cc16',
    'Advanced / Pro-Track': '#06b6d4',
    'Tour Challenger': '#8b5cf6',
    'Tour Elite': '#8b5cf6',
  };
  const color = colors[name] || '#6b7280';
  return <div style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: color, marginRight: 8 }} />;
}

function Collapsible({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState<boolean>(defaultOpen);
  return (
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: '#111',
          fontSize: 14,
        }}
      >
        <span style={{ fontSize: 12, display: 'inline-block', width: 14 }}>{open ? '▾' : '▸'}</span>
        <strong style={{ fontWeight: 700 }}>{title}</strong>
      </button>
      {open ? <div style={{ marginTop: 8 }}>{children}</div> : null}
    </div>
  );
}

export default function BandStandardization() {
  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Band Standardization</div>
      <div style={{ fontSize: 12, color: '#444', marginBottom: 12 }}>Quick primer on what the numeric bands mean and how progress is measured.</div>

      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 8 }}>
        <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0', minWidth: 320, flex: '0 0 420px' }}>
          <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center' }}><BandBadge name="Unstable" /><span>Unstable (0–6)</span></h4>
          <Collapsible title="What the process looks like" defaultOpen={false}>
            <ul>
              <li>Inconsistent preparation</li>
              <li>Contact point fluctuates</li>
              <li>Balance frequently compromised</li>
              <li>Ball height and depth vary widely</li>
              <li>Can produce a good shot, but not predictably</li>
            </ul>
            <p style={{ margin: '6px 0' }}>Quality is accidental more than constructed.</p>
          </Collapsible>
          <Collapsible title="When it breaks down">
            <ul>
              <li>Any directional change</li>
              <li>Any increase in pace</li>
              <li>Movement while hitting</li>
              <li>Slight time pressure</li>
              <li>Breakdown threshold is very low.</li>
            </ul>
          </Collapsible>
          <Collapsible title="What results occur as a result">
            <ul>
              <li>Ball into net or long</li>
              <li>Mishits</li>
              <li>Short balls</li>
              <li>Loss of rally within 1–3 shots</li>
              <li>Points end quickly.</li>
            </ul>
          </Collapsible>
        </div>

        <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0', minWidth: 320, flex: '0 0 420px' }}>
          <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center' }}><BandBadge name="Conditional" /><span>Conditional (7–12)</span></h4>
          <Collapsible title="What the process looks like">
            <ul>
              <li>Can rally 4–6 balls at moderate pace</li>
              <li>Better spacing and preparation</li>
              <li>Depth fluctuates (some deep balls, many mid-court)</li>
              <li>Quality depends on ball speed and comfort zone</li>
              <li>Process holds if conditions are comfortable.</li>
            </ul>
          </Collapsible>
          <Collapsible title="When it breaks down">
            <ul>
              <li>Opponent increases pace</li>
              <li>Forced wide</li>
              <li>Direction change under movement</li>
              <li>Slight fatigue</li>
              <li>Player attempts higher-risk shot than their stability supports</li>
            </ul>
          </Collapsible>
        </div>

        <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0', minWidth: 320, flex: '0 0 420px' }}>
          <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center' }}><BandBadge name="Functional" /><span>Functional (13–18)</span></h4>
          <Collapsible title="What the process looks like">
            <ul>
              <li>Can sustain 6–10 shot rallies</li>
              <li>Depth more consistent</li>
              <li>Directional control present</li>
              <li>Can defend and recover</li>
              <li>Beginning to construct points intentionally</li>
            </ul>
          </Collapsible>
          <Collapsible title="Won Point Example (Anchor)">
            <p style={{ margin: 0 }}>Rally at 4–4. Player trades 5 crosscourt balls, changes direction safely, finishes the point through controlled rally + deliberate direction change.</p>
          </Collapsible>
        </div>

        <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0', minWidth: 320, flex: '0 0 420px' }}>
          <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center' }}><BandBadge name="Competitive" /><span>Competitive (19–24)</span></h4>
          <Collapsible title="What the process looks like">
            <ul>
              <li>Contact and rhythm preserved during match-pressure</li>
              <li>Skills remain intact while constructing points tactically</li>
              <li>Solid preparation and spacing</li>
            </ul>
          </Collapsible>
        </div>

        <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0', minWidth: 320, flex: '0 0 420px' }}>
          <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center' }}><BandBadge name="Advanced / Pro-Track" /><span>Advanced / Pro-Track (25–30)</span></h4>
          <Collapsible title="What the process looks like">
            <ul>
              <li>Consistent depth within 3–4 feet of baseline</li>
              <li>Better spacing and balance under pace</li>
              <li>Can stack 5–8 high-quality balls in a row</li>
            </ul>
          </Collapsible>
        </div>

        <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0', minWidth: 320, flex: '0 0 420px' }}>
            <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center' }}><BandBadge name="Tour Challenger" /><span>Tour Challenger (31–40)</span></h4>
            <Collapsible title="What the process looks like">
              <ul>
                <li>Depth consistently within 1–3 feet of baseline</li>
                <li>Pace + spin combination maintained under full speed</li>
                <li>Direction changes executed late and disguised</li>
              </ul>
            </Collapsible>
          </div>

          <div style={{ background: '#fafafa', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0', minWidth: 320, flex: '0 0 420px' }}>
            <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center' }}><BandBadge name="Tour Elite" /><span>Tour Elite (41–50)</span></h4>
            <Collapsible title="What the process looks like">
              <ul>
                <li>Depth consistently within 1–3 feet of baseline</li>
                <li>Pace + spin combination maintained under full speed</li>
                <li>Direction changes executed late and disguised</li>
              </ul>
            </Collapsible>
          </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <div style={{ width: 56, height: 6, borderRadius: 9999, background: '#e5e7eb' }} />
        <div style={{ fontSize: 12, color: '#6b7280' }}>Swipe to view bands →</div>
      </div>
    </div>
  );
}
