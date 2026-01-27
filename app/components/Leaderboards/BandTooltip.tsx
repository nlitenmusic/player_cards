"use client";
import React from "react";

// BandTooltip acts as a hover/focus trigger only. It emits the hovered band context
// to a parent via `onHover` instead of rendering an inline floating tooltip.
export default function BandTooltip({
  value,
  skill,
  component,
  id,
  children,
  onHover,
}: {
  value: number | string;
  skill: string;
  component: string;
  id?: number | string;
  children?: React.ReactNode;
  onHover?: (ctx: { skill: string; component: string; value: number | null } | null) => void;
}) {
  const numeric = Number(value);
  const isNumber = Number.isFinite(numeric);
  const bandValue = isNumber ? Math.round(numeric) : null;

  function handleClick() {
    try {
      try { console.debug('BandTooltip click', { skill, component, value: bandValue }); } catch(e){}
      // mark as immediate so parents can open without delay
      onHover?.({ skill, component, value: bandValue, immediate: true } as any);
    } catch (e) {
      // swallow
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <span
      style={{ position: "relative", display: "inline-block", cursor: "pointer" }}
      onClick={handleClick}
      onKeyDown={handleKey}
      role="button"
      tabIndex={0}
      aria-label={typeof children === 'string' ? String(children) : 'Show band info'}
    >
      <span>{children ? children : (isNumber ? String(Math.round(numeric * 100) / 100) : String(value ?? ''))}</span>
    </span>
  );
}
