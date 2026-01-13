
import React from 'react';
import AddSessionPageClient from './AddSessionPageClient';

export default async function NewSessionPage({ searchParams }: { searchParams?: any }) {
	const sp = await (searchParams as Promise<any> | any);
	const playerId = sp?.player_id ?? null;

	return (
		<div style={{ display: 'flex', justifyContent: 'center', paddingTop: 20 }}>
			<AddSessionPageClient playerId={playerId} />
		</div>
	);
}
