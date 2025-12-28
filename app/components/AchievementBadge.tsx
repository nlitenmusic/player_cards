'use client';
import React from 'react';

export default function AchievementBadge({ achievement }: { achievement: any }) {
  if (!achievement) return null;
  const icon = achievement.icon_url;
  return (
    <div title={achievement.name} style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 6 }}>
      {icon ? (
        <img src={icon} alt={achievement.name} style={{ width: 20, height: 20, borderRadius: 4 }} />
      ) : (
        <div style={{ width: 20, height: 20, borderRadius: 4, background: '#f3f4f6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
          🏆
        </div>
      )}
    </div>
  );
}
