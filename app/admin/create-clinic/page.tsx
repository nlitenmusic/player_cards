"use client";
import dynamic from 'next/dynamic';
import React from 'react';

const CreateClinicFlow = dynamic(() => import('./CreateClinicFlow'), { ssr: false });

export default function AdminCreateClinicPage() {
  return (
    <div style={{ padding: 24 }}>
      <CreateClinicFlow />
    </div>
  );
}
