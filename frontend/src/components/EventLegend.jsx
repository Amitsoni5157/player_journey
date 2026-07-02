/**
 * EventLegend.jsx
 * Visual legend for event types and player colors.
 */

import { EVENT_COLORS, EVENT_LABELS } from "../utils/mapConfig";

const ALL_EVENTS = Object.keys(EVENT_LABELS);

function LegendShape({ event, color }) {
  if (event === "Kill" || event === "BotKill") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" className="legend-shape" style={{ marginRight: 8, flexShrink: 0 }}>
        <path d="M 3 3 L 11 11 M 11 3 L 3 11" stroke={color} strokeWidth="3.5" />
      </svg>
    );
  }
  if (event === "Loot") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" className="legend-shape" style={{ marginRight: 8, flexShrink: 0 }}>
        <polygon points="7,1 13,7 7,13 1,7" fill={color} stroke="rgba(20,20,20,0.9)" strokeWidth="1" />
      </svg>
    );
  }
  if (event === "KilledByStorm") {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" className="legend-shape" style={{ marginRight: 8, flexShrink: 0 }}>
        <polygon points="7,2 13,11 1,11" fill={color} stroke="rgba(20,20,20,0.9)" strokeWidth="1" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="legend-shape" style={{ marginRight: 8, flexShrink: 0 }}>
      <circle cx="7" cy="7" r="5" fill={color} stroke="rgba(20,20,20,0.9)" strokeWidth="1" />
    </svg>
  );
}

export default function EventLegend({ players }) {
  return (
    <div className="legend-panel">
      <div className="legend-section">
        <div className="legend-title">Event Types</div>
        <div className="legend-items">
          {ALL_EVENTS.map((ev) => (
            <div key={ev} className="legend-item" style={{ display: 'flex', alignItems: 'center' }}>
              <LegendShape event={ev} color={EVENT_COLORS[ev] || "#888"} />
              <span className="legend-label">{EVENT_LABELS[ev]}</span>
            </div>
          ))}
        </div>
      </div>

      {players && players.length > 0 && (
        <div className="legend-section">
          <div className="legend-title">Players</div>
          <div className="legend-items">
            {players
              .filter((p) => !p.is_bot)
              .slice(0, 10)
              .map((p) => (
                <div key={p.user_id} className="legend-item" style={{ display: 'flex', alignItems: 'center' }}>
                  <LegendShape event="Position" color={p.color} />
                  <span className="legend-label legend-id">
                    {p.user_id.slice(0, 8)}…
                  </span>
                </div>
              ))}
            {players.filter((p) => p.is_bot).length > 0 && (
              <div className="legend-item" style={{ display: 'flex', alignItems: 'center' }}>
                <LegendShape event="BotPosition" color="rgba(180,180,180,0.5)" />
                <span className="legend-label">
                  Bots ({players.filter((p) => p.is_bot).length})
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
