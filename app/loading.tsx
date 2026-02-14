import React from 'react';

export default function Loading() {
	return (
		<div style={{ position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }} aria-hidden>
			<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
				<img src="/favicon.ico" alt="app logo" style={{ width: 56, height: 40, objectFit: 'contain' }} aria-hidden />
				<div style={{ width: 12, height: 12, borderRadius: 6, background: '#111', animation: 'pc-blink 900ms infinite' }} />
			<style>{`@keyframes pc-blink {0% { opacity: 0.15; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.15; transform: scale(0.9); } }`}</style>
			</div>
		</div>
	);
}

