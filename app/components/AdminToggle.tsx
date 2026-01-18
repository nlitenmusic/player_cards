"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AdminToggle() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const isAdmin = pathname.startsWith("/admin");

  const handleClick = () => {
    const target = isAdmin ? "/" : "/admin";
    try {
      router.push(target);
    } catch (e) {
      // fallback for environments where router.push may throw
      window.location.href = target;
    }
  };

  return (
    <div style={{ position: "fixed", top: 12, right: 12, zIndex: 99999 }}>
      <button
        onClick={handleClick}
        aria-pressed={isAdmin}
        title={isAdmin ? "Switch to user view" : "Switch to admin view"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 9999,
          border: "1px solid rgba(0,0,0,0.12)",
          background: "var(--pc-toggle-bg, #fff)",
          color: "var(--foreground, #111)",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600 }}>{isAdmin ? "Admin" : "User"}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
