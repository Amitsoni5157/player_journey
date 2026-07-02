/**
 * App.jsx
 * Root component — wires together all state, hooks, and components.
 */

import { useState } from "react";
import Sidebar from "./components/Sidebar";
import MinimapCanvas from "./components/MinimapCanvas";
import Timeline from "./components/Timeline";
import EventLegend from "./components/EventLegend";
import { useDates, useMatches, useMatchData, useHeatmap } from "./hooks/useMatchData";
import { usePlayback } from "./hooks/usePlayback";
import { COMBAT_EVENTS } from "./utils/mapConfig";

export default function App() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMap, setSelectedMap] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showBots, setShowBots] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [activeEvents, setActiveEvents] = useState([...COMBAT_EVENTS]);

  const { dates } = useDates();
  const { matches, loading: loadingMatches } = useMatches(selectedDate, selectedMap);
  const { data: matchData, stats, loading: loadingMatch, error } = useMatchData(selectedMatch, showBots);

  const { points: heatmapPoints } = useHeatmap(
    selectedDate, selectedMap, null, showHeatmap && !!selectedMap
  );

  const {
    currentTs, isPlaying, speed,
    play, pause, seek, reset, setSpeed,
  } = usePlayback(matchData?.min_ts, matchData?.max_ts);

  const handleMatchSelect = (matchId) => {
    setSelectedMatch(matchId);
    setShowHeatmap(false);
  };

  return (
    <div className="app-layout">
      <Sidebar
        dates={dates}
        matches={matches}
        selectedDate={selectedDate}
        selectedMap={selectedMap}
        selectedMatch={selectedMatch}
        onDateChange={(d) => { setSelectedDate(d); setSelectedMatch(null); }}
        onMapChange={(m) => { setSelectedMap(m); setSelectedMatch(null); }}
        onMatchChange={handleMatchSelect}
        showBots={showBots}
        onBotsToggle={() => setShowBots((v) => !v)}
        showHeatmap={showHeatmap}
        onHeatmapToggle={() => setShowHeatmap((v) => !v)}
        stats={stats}
        loadingMatches={loadingMatches}
      />

      <main className="main-area">
        {/* Top bar */}
        <div className="topbar">
          <div className="topbar-breadcrumb">
            {selectedDate && <span className="breadcrumb-item">{selectedDate.replace("_", " ")}</span>}
            {matchData?.map_id && <><span className="breadcrumb-sep">›</span><span className="breadcrumb-item">{matchData.map_id}</span></>}
            {selectedMatch && <><span className="breadcrumb-sep">›</span><span className="breadcrumb-item match-id-small">{selectedMatch.slice(0, 18)}…</span></>}
          </div>
          <div className="topbar-status">
            {loadingMatch && <span className="status-pill loading">Loading match…</span>}
            {error && <span className="status-pill error">⚠ {error}</span>}
            {matchData && !loadingMatch && (
              <span className="status-pill ok">
                ✓ {matchData.players.length} players loaded
              </span>
            )}
          </div>
        </div>

        {/* Canvas area */}
        <div className="canvas-area">
          <MinimapCanvas
            matchData={matchData}
            currentTs={currentTs}
            showHeatmap={showHeatmap}
            heatmapPoints={heatmapPoints}
            activeEvents={activeEvents}
            showBots={showBots}
          />

          {/* Legend floats over canvas */}
          {matchData && (
            <EventLegend players={matchData.players} />
          )}
        </div>

        {/* Timeline */}
        <Timeline
          currentTs={currentTs}
          minTs={matchData?.min_ts ?? 0}
          maxTs={matchData?.max_ts ?? 0}
          isPlaying={isPlaying}
          speed={speed}
          onPlay={play}
          onPause={pause}
          onSeek={seek}
          onReset={reset}
          onSpeedChange={setSpeed}
          activeEvents={activeEvents}
          onEventsChange={setActiveEvents}
        />
      </main>
    </div>
  );
}
