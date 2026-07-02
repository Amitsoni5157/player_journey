/**
 * usePlayback.js
 * Timeline animation hook — animates ts cursor through match events.
 */

import { useState, useRef, useCallback, useEffect } from "react";

const DEFAULT_SPEED = 10; // 10× real-time

export function usePlayback(minTs, maxTs) {
  const [currentTs, setCurrentTs] = useState(minTs ?? 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const intervalRef = useRef(null);

  // Reset when match changes
  useEffect(() => {
    setCurrentTs(minTs ?? 0);
    setIsPlaying(false);
  }, [minTs, maxTs]);

  const tick = useCallback(() => {
    setCurrentTs((prev) => {
      const next = prev + 100 * speed; // advance by 100ms * speed each tick
      if (next >= maxTs) {
        setIsPlaying(false);
        return maxTs;
      }
      return next;
    });
  }, [speed, maxTs]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(tick, 50); // update every 50ms
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, tick]);

  const play = useCallback(() => {
    if (currentTs >= maxTs) setCurrentTs(minTs ?? 0);
    setIsPlaying(true);
  }, [currentTs, minTs, maxTs]);

  const pause = useCallback(() => setIsPlaying(false), []);

  const seek = useCallback((ts) => {
    setCurrentTs(ts);
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setCurrentTs(minTs ?? 0);
    setIsPlaying(false);
  }, [minTs]);

  return { currentTs, isPlaying, speed, setSpeed, play, pause, seek, reset };
}
