/**
 * useMatchData.js
 * Custom hook for fetching match list and match event data from the backend API.
 */

import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:8000";

export function useDates() {
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/dates`)
      .then((r) => r.json())
      .then(setDates)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { dates, loading };
}

export function useMatches(date, mapId) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (mapId) params.set("map_id", mapId);

    fetch(`${API_BASE}/api/matches?${params}`)
      .then((r) => r.json())
      .then(setMatches)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [date, mapId]);

  return { matches, loading };
}

export function useMatchData(matchId, includeBots) {
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(() => {
    if (!matchId) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ include_bots: includeBots });

    Promise.all([
      fetch(`${API_BASE}/api/match?match_id=${encodeURIComponent(matchId)}&${params}`).then((r) => {
        if (!r.ok) throw new Error(`Match not found: ${matchId}`);
        return r.json();
      }),
      fetch(`${API_BASE}/api/stats?match_id=${encodeURIComponent(matchId)}`).then((r) => r.json()),
    ])
      .then(([matchData, matchStats]) => {
        setData(matchData);
        setStats(matchStats);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [matchId, includeBots]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, stats, loading, error };
}

export function useHeatmap(date, mapId, eventType, enabled) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !mapId) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (mapId) params.set("map_id", mapId);
    if (eventType) params.set("event_type", eventType);

    fetch(`${API_BASE}/api/heatmap?${params}`)
      .then((r) => r.json())
      .then(setPoints)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [date, mapId, eventType, enabled]);

  return { points, loading };
}
