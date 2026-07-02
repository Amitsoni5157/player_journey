import { useRef, useEffect, useState, useCallback } from "react";
import { worldToCanvas } from "../utils/coordTransform";
import { MAP_CONFIGS, EVENT_COLORS } from "../utils/mapConfig";

const CANVAS_SIZE = 700;
const PATH_LINE_WIDTH = 1.5;
const MARKER_RADIUS = 5;
const POSITION_DOT_RADIUS = 1.2;

// Event marker shapes/sizes
const MARKER_SIZES = {
  Kill: 7,
  Killed: 7,
  BotKill: 6,
  BotKilled: 6,
  KilledByStorm: 8,
  Loot: 5,
};

export default function MinimapCanvas({
  matchData,
  currentTs,
  showHeatmap,
  heatmapPoints,
  activeEvents,
  showBots,
}) {
  const canvasRef = useRef(null);
  const bgImageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  const mapId = matchData?.map_id;
  const mapConfig = mapId ? MAP_CONFIGS[mapId] : null;

  // Load minimap background image
  useEffect(() => {
    if (!mapConfig) return;
    setImageLoaded(false);
    // Reset zoom on map change
    setZoom(1);
    setPan({ x: 0, y: 0 });
    
    const img = new Image();
    img.src = mapConfig.image;
    img.onload = () => {
      bgImageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      bgImageRef.current = null;
      setImageLoaded(true);
    };
  }, [mapConfig?.image]);

  // Handle Zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (e) => {
      e.preventDefault();
      const scaleAdjust = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const newZoom = Math.min(Math.max(1, zoom * scaleAdjust), 15);
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate new pan to keep mouse pointing to the same map spot
      const originalX = (mouseX - pan.x) / zoom;
      const originalY = (mouseY - pan.y) / zoom;

      setPan({
        x: mouseX - originalX * newZoom,
        y: mouseY - originalY * newZoom
      });
      setZoom(newZoom);
    };
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [zoom, pan]);

  // Handle Pan
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    setLastMouse({ x: e.clientX, y: e.clientY });
  };
  const handleMouseUp = () => setIsDragging(false);

  // Main render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapConfig) return;
    const ctx = canvas.getContext("2d");

    // Clear entire canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.save();
    // Apply pan and zoom
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw background
    if (bgImageRef.current) {
      ctx.drawImage(bgImageRef.current, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
      // Dark overlay for readability
      ctx.fillStyle = "rgba(5, 8, 20, 0.35)";
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    } else {
      ctx.fillStyle = "#0d1117";
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.strokeStyle = "rgba(108,99,255,0.2)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= CANVAS_SIZE; i += 50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_SIZE); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_SIZE, i); ctx.stroke();
      }
    }

    if (matchData) {
      // ── Heatmap layer ────────────────────────────────────────────────────────
      if (showHeatmap && heatmapPoints?.length > 0) {
        heatmapPoints.forEach(({ x, z, weight }) => {
          const { px, py } = worldToCanvas(x, z, mapConfig, CANVAS_SIZE);
          // Scale down radius based on zoom so it doesn't get massively huge
          const baseRadius = 18 * weight + 4;
          const radius = baseRadius / Math.sqrt(zoom);
          const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
          grad.addColorStop(0, `rgba(255, 71, 87, ${0.7 * weight})`);
          grad.addColorStop(0.5, `rgba(255, 165, 2, ${0.4 * weight})`);
          grad.addColorStop(1, "rgba(255, 165, 2, 0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // ── Player paths & event markers ─────────────────────────────────────────
      matchData.players.forEach((player) => {
        if (!showBots && player.is_bot) return;

        // Filter events up to currentTs
        const visibleEvents = player.events.filter((e) => e.ts <= currentTs);
        if (visibleEvents.length === 0) return;

        const positionEvents = visibleEvents.filter(
          (e) => e.event === "Position" || e.event === "BotPosition"
        );
        const actionEvents = visibleEvents.filter(
          (e) => e.event !== "Position" && e.event !== "BotPosition"
        );

        // Draw movement path
        if (positionEvents.length > 1) {
          ctx.beginPath();
          ctx.strokeStyle = player.color;
          ctx.lineWidth = (player.is_bot ? 1.2 : PATH_LINE_WIDTH) / Math.sqrt(zoom);
          ctx.globalAlpha = player.is_bot ? 0.55 : 0.85;
          ctx.lineJoin = "round";
          ctx.lineCap = "round";

          positionEvents.forEach((e, i) => {
            const { px, py } = worldToCanvas(e.x, e.z, mapConfig, CANVAS_SIZE);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.stroke();
          ctx.globalAlpha = 1;

          // Draw position dots (recent trail)
          if (!player.is_bot) {
            const trail = positionEvents.slice(-10);
            trail.forEach((e, i) => {
              const { px, py } = worldToCanvas(e.x, e.z, mapConfig, CANVAS_SIZE);
              ctx.beginPath();
              ctx.fillStyle = player.color;
              ctx.globalAlpha = (i + 1) / trail.length * 0.5;
              ctx.arc(px, py, POSITION_DOT_RADIUS / Math.sqrt(zoom), 0, Math.PI * 2);
              ctx.fill();
            });
            ctx.globalAlpha = 1;
          }
        }

        // Draw current player position indicator
        if (positionEvents.length > 0 && !player.is_bot) {
          const last = positionEvents[positionEvents.length - 1];
          const { px, py } = worldToCanvas(last.x, last.z, mapConfig, CANVAS_SIZE);

          const glowR = 10 / Math.sqrt(zoom);
          const dotR = 4 / Math.sqrt(zoom);

          // Outer glow
          const glow = ctx.createRadialGradient(px, py, 0, px, py, glowR);
          glow.addColorStop(0, player.color + "99");
          glow.addColorStop(1, "transparent");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(px, py, glowR, 0, Math.PI * 2);
          ctx.fill();

          // Dot
          ctx.beginPath();
          ctx.fillStyle = player.color;
          ctx.arc(px, py, dotR, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 1.5 / Math.sqrt(zoom);
          ctx.stroke();
        }

        // Draw action event markers
        actionEvents.forEach((e) => {
          if (!activeEvents.includes(e.event)) return;
          const { px, py } = worldToCanvas(e.x, e.z, mapConfig, CANVAS_SIZE);
          const color = EVENT_COLORS[e.event] || "#fff";
          
          // Adjust radius slightly based on zoom so they don't overlap too much when zoomed in
          const radius = (MARKER_SIZES[e.event] || MARKER_RADIUS) / Math.pow(zoom, 0.4);

          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 2;

          ctx.beginPath();
          ctx.fillStyle = color;
          ctx.strokeStyle = "rgba(20,20,20,0.9)";
          ctx.lineWidth = 1 / Math.sqrt(zoom);
          ctx.globalAlpha = 0.85;

          if (e.event === "Kill" || e.event === "BotKill") {
            drawX(ctx, px, py, radius);
          } else if (e.event === "Loot") {
            drawDiamond(ctx, px, py, radius);
          } else if (e.event === "KilledByStorm") {
            drawTriangle(ctx, px, py, radius);
          } else {
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        });
      });
    }
    
    ctx.restore();

    // ── Legend timestamp (Fixed position, immune to pan/zoom) ────────────────
    if (matchData) {
      const elapsed = currentTs - (matchData.min_ts || 0);
      const totalSec = Math.floor(elapsed / 1000);
      const m = Math.floor(totalSec / 60);
      const s = (totalSec % 60).toString().padStart(2, "0");

      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(8, 8, 90, 26);
      ctx.fillStyle = "#6c63ff";
      ctx.font = "bold 13px 'Inter', monospace";
      ctx.fillText(`⏱ ${m}:${s}`, 16, 26);
    }

  }, [matchData, currentTs, mapConfig, showHeatmap, heatmapPoints, activeEvents, showBots, imageLoaded, pan, zoom]);

  return (
    <div className="minimap-wrapper" style={{ overflow: "hidden", cursor: isDragging ? "grabbing" : "grab" }}>
      {!mapConfig && (
        <div className="minimap-placeholder">
          <span>Select a match to begin</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="minimap-canvas"
        style={{ display: mapConfig ? "block" : "none" }}
      />
    </div>
  );
}

// ── Drawing helpers ──────────────────────────────────────────────────────────
function drawX(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-r * 0.25, -r, r * 0.5, r * 2);
  ctx.fillRect(-r, -r * 0.25, r * 2, r * 0.5);
  ctx.strokeRect(-r * 0.25, -r, r * 0.5, r * 2);
  ctx.strokeRect(-r, -r * 0.25, r * 2, r * 0.5);
  ctx.restore();
}

function drawDiamond(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawTriangle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y + r * 0.7);
  ctx.lineTo(x - r, y + r * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
