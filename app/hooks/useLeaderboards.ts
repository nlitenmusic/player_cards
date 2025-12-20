"use client";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useLeaderboards() {
  const { data, error, mutate } = useSWR('/api/admin/leaderboards', fetcher, { refreshInterval: 0 });
  return { leaderboards: data?.leaderboards ?? null, loading: !data && !error, error, refresh: () => mutate() };
}
