/**
 * coordTransform.js
 * Converts 3D world coordinates (x, z) to 2D canvas pixel positions.
 *
 * Formula (from player_data/README.md):
 *   u = (x - originX) / scale
 *   v = (z - originZ) / scale
 *   pixel_x = u * imageSize
 *   pixel_y = (1 - v) * imageSize   ← Y is flipped (image origin top-left)
 */

const IMAGE_SIZE = 1024; // minimap images are 1024×1024 px

/**
 * Convert world (x, z) → canvas pixel (px, py).
 * @param {number} x - World X coordinate
 * @param {number} z - World Z coordinate
 * @param {object} mapConfig - { scale, originX, originZ }
 * @param {number} canvasSize - Canvas width/height in pixels (square)
 * @returns {{ px: number, py: number }}
 */
export function worldToCanvas(x, z, mapConfig, canvasSize) {
  const { scale, originX, originZ } = mapConfig;
  const u = (x - originX) / scale;
  const v = (z - originZ) / scale;

  // Scale from image space (1024) to canvas space
  const ratio = canvasSize / IMAGE_SIZE;
  const px = u * IMAGE_SIZE * ratio;
  const py = (1 - v) * IMAGE_SIZE * ratio;

  return { px, py };
}

/**
 * Check if a canvas position is within bounds.
 */
export function inBounds(px, py, canvasSize) {
  return px >= 0 && px <= canvasSize && py >= 0 && py <= canvasSize;
}

/**
 * Format milliseconds into a MM:SS display string.
 */
export function formatMs(ms) {
  if (!ms || isNaN(ms)) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
