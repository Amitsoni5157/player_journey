/**
 * Sidebar.jsx
 * Filter panel: Date, Map, Match selector, Bot toggle, Heatmap toggle.
 */

import { useState } from "react";
import { MAP_IDS, MAP_CONFIGS } from "../utils/mapConfig";

export default function Sidebar({
  dates,
  matches,
  selectedDate,
  selectedMap,
  selectedMatch,
  onDateChange,
  onMapChange,
  onMatchChange,
  showBots,
  onBotsToggle,
  showHeatmap,
  onHeatmapToggle,
  stats,
  loadingMatches,
}) {
  const [matchSearch, setMatchSearch] = useState("");

  const filteredMatches = matches.filter((m) =>
    m.match_id.toLowerCase().includes(matchSearch.toLowerCase())
  );

  const formatDate = (d) => d.replace("_", " ");
  const formatMatchId = (id) => id.replace(".nakama-0", "").slice(0, 18) + "…";

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-logo">
        <span className="logo-icon">🎮</span>
        <div>
          <h1 className="logo-title">LILA BLACK</h1>
          <p className="logo-sub">Player Journey Viewer</p>
        </div>
      </div>

      <div className="sidebar-section">
        <label className="filter-label">📅 Date</label>
        <div className="chip-group">
          {dates.map((d) => (
            <button
              key={d}
              id={`date-${d}`}
              className={`chip ${selectedDate === d ? "chip-active" : ""}`}
              onClick={() => onDateChange(d)}
            >
              {formatDate(d)}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <label className="filter-label">🗺️ Map</label>
        <div className="chip-group">
          <button
            id="map-all"
            className={`chip ${!selectedMap ? "chip-active" : ""}`}
            onClick={() => onMapChange(null)}
          >
            All Maps
          </button>
          {MAP_IDS.map((id) => (
            <button
              key={id}
              id={`map-${id}`}
              className={`chip ${selectedMap === id ? "chip-active" : ""}`}
              onClick={() => onMapChange(id)}
            >
              {MAP_CONFIGS[id].label}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <label className="filter-label">
          🎯 Matches
          {loadingMatches && <span className="loading-dot" />}
        </label>
        <input
          type="text"
          id="match-search"
          name="match-search"
          className="search-input"
          placeholder="Search match ID…"
          value={matchSearch}
          onChange={(e) => setMatchSearch(e.target.value)}
        />
        <div className="match-list">
          {filteredMatches.slice(0, 50).map((m) => (
            <button
              key={m.match_id}
              id={`match-${m.match_id.slice(0, 8)}`}
              className={`match-item ${selectedMatch === m.match_id ? "match-active" : ""}`}
              onClick={() => onMatchChange(m.match_id)}
            >
              <div className="match-item-top">
                <span className="match-map">{m.map_id}</span>
                <span className="match-players">
                  👤 {m.human_count} · 🤖 {m.bot_count}
                </span>
              </div>
              <div className="match-id-display">{formatMatchId(m.match_id)}</div>
            </button>
          ))}
          {filteredMatches.length === 0 && !loadingMatches && (
            <p className="empty-msg">No matches found</p>
          )}
        </div>
      </div>

      <div className="sidebar-section">
        <label className="filter-label">⚙️ Options</label>
        <div className="toggle-group">
          <button
            id="toggle-bots"
            className={`toggle-btn ${showBots ? "toggle-on" : ""}`}
            onClick={onBotsToggle}
          >
            🤖 Show Bots
          </button>
          <button
            id="toggle-heatmap"
            className={`toggle-btn ${showHeatmap ? "toggle-on" : ""}`}
            onClick={onHeatmapToggle}
          >
            🌡️ Heatmap
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      {stats && (
        <div className="sidebar-section stats-panel">
          <label className="filter-label">📊 Match Stats</label>
          <div className="stats-grid">
            <StatCard label="Kills" value={stats.kills} color="#ff4757" />
            <StatCard label="Deaths" value={stats.deaths} color="#ff6b81" />
            <StatCard label="Bot Kills" value={stats.bot_kills} color="#ffa502" />
            <StatCard label="Loot" value={stats.loots} color="#eccc68" />
            <StatCard label="Storm" value={stats.storm_deaths} color="#2ed573" />
            <StatCard label="Duration" value={fmtDuration(stats.duration_ms)} color="#6c63ff" />
          </div>
        </div>
      )}
    </aside>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function fmtDuration(ms) {
  if (!ms) return "–";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}
