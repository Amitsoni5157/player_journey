/**
 * Timeline.jsx
 * Playback timeline with slider, play/pause, speed control, and event filter chips.
 */

import { formatMs } from "../utils/coordTransform";
import { COMBAT_EVENTS, EVENT_COLORS, EVENT_LABELS } from "../utils/mapConfig";

const SPEEDS = [1, 2, 5, 10, 20, 50, 100, 200];

export default function Timeline({
  currentTs,
  minTs,
  maxTs,
  isPlaying,
  speed,
  onPlay,
  onPause,
  onSeek,
  onReset,
  onSpeedChange,
  activeEvents,
  onEventsChange,
}) {
  const duration = maxTs - minTs || 1;
  const progress = ((currentTs - minTs) / duration) * 100;

  const handleSlider = (e) => {
    const val = minTs + ((e.target.value / 100) * duration);
    onSeek(val);
  };

  const toggleEvent = (ev) => {
    if (activeEvents.includes(ev)) {
      onEventsChange(activeEvents.filter((e) => e !== ev));
    } else {
      onEventsChange([...activeEvents, ev]);
    }
  };

  const noMatch = !maxTs;

  return (
    <div className="timeline-bar">
      {/* Scrubber */}
      <div className="timeline-row">
        <button
          id="btn-reset"
          className="ctrl-btn"
          onClick={onReset}
          disabled={noMatch}
          title="Reset"
        >⏮</button>

        <button
          id="btn-playpause"
          className="ctrl-btn ctrl-btn-primary"
          onClick={isPlaying ? onPause : onPlay}
          disabled={noMatch}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        <div className="timeline-track-wrapper">
          <input
            id="timeline-slider"
            type="range"
            min={0}
            max={100}
            step={0.01}
            value={progress || 0}
            onChange={handleSlider}
            disabled={noMatch}
            className="timeline-slider"
          />
          <div
            className="timeline-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <span className="timeline-time">
          {formatMs(currentTs - minTs)} / {formatMs(maxTs - minTs)}
        </span>

        {/* Speed selector */}
        <div className="speed-group">
          {SPEEDS.map((s) => (
            <button
              key={s}
              id={`speed-${s}x`}
              className={`speed-btn ${speed === s ? "speed-active" : ""}`}
              onClick={() => onSpeedChange(s)}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* Event filter chips */}
      <div className="event-filter-row">
        <span className="event-filter-label">Events:</span>
        {COMBAT_EVENTS.map((ev) => (
          <button
            key={ev}
            id={`event-filter-${ev}`}
            className={`event-chip ${activeEvents.includes(ev) ? "event-chip-on" : ""}`}
            style={{
              "--chip-color": EVENT_COLORS[ev] || "#999",
            }}
            onClick={() => toggleEvent(ev)}
          >
            {EVENT_LABELS[ev]}
          </button>
        ))}
        <button
          id="events-all"
          className="event-chip"
          onClick={() => onEventsChange([...COMBAT_EVENTS])}
        >
          All
        </button>
        <button
          id="events-none"
          className="event-chip"
          onClick={() => onEventsChange([])}
        >
          None
        </button>
      </div>
    </div>
  );
}
