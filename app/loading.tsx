import React from 'react';

export default function Loading() {
	return (
		<div style={{ position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }} aria-hidden>
			<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
				<div style={{ width: 84, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: '#fff', border: '2px solid #111', boxSizing: 'border-box' }}>
					<svg width="56" height="40" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
						<rect x="1" y="2" width="24" height="14" rx="2" stroke="#111" strokeWidth="1.5" fill="none" />
						<rect x="5" y="6" width="10" height="6" rx="1" stroke="#111" strokeWidth="1" fill="#f7f7f7" />
					</svg>
				</div>
				<div style={{ width: 12, height: 12, borderRadius: 6, background: '#111', animation: 'pc-blink 900ms infinite' }} />
			<style>{`@keyframes pc-blink {0% { opacity: 0.15; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.15; transform: scale(0.9); } }`}</style>
			</div>
		</div>
	);
}

