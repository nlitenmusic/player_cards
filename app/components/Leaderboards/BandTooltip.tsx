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

  function handleEnter() {
    try {
      // debug: emit hover event
      // console.debug helps confirm the hover payload in browser DevTools
      try { console.debug('BandTooltip enter', { skill, component, value: bandValue }); } catch(e){}
      onHover?.({ skill, component, value: bandValue });
    } catch (e) {
      // swallow
    }
  }
  function handleLeave() {
    try {
      try { console.debug('BandTooltip leave', { skill, component }); } catch(e){}
      onHover?.(null);
    } catch (e) {
      // swallow
    }
  }

  return (
    <span
      style={{ position: "relative", display: "inline-block", cursor: "default" }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      tabIndex={0}
      aria-hidden={true}
    >
      <span>{children ? children : (isNumber ? String(Math.round(numeric * 100) / 100) : String(value ?? ''))}</span>
    </span>
  );
}
