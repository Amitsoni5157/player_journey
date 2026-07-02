"""
main.py
FastAPI application entry point for the Player Journey Visualization API.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from typing import Optional, List

from models import MatchData, MatchSummary, HeatmapPoint, MatchStats
from data_loader import (
    get_available_dates,
    get_matches,
    get_match_data,
    get_heatmap,
    get_match_stats,
)

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="LILA BLACK — Player Journey API",
    description="Backend API for visualizing player journeys in LILA BLACK gameplay data.",
    version="1.0.0",
)

# Allow React dev server to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (Vercel, localhost, etc.)
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve minimap images as static files
MINIMAPS_DIR = Path(__file__).parent.parent / "minimaps"
if MINIMAPS_DIR.exists():
    app.mount("/minimaps", StaticFiles(directory=str(MINIMAPS_DIR)), name="minimaps")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/dates", response_model=List[str], tags=["Filters"])
def list_dates():
    """Return available date folders (e.g. February_10 → February_14)."""
    return get_available_dates()


@app.get("/api/matches", response_model=List[MatchSummary], tags=["Filters"])
def list_matches(
    date: Optional[str] = Query(None, description="e.g. February_10"),
    map_id: Optional[str] = Query(None, description="AmbroseValley | GrandRift | Lockdown"),
):
    """List all matches, optionally filtered by date and/or map."""
    return get_matches(date=date, map_id=map_id)


@app.get("/api/match", response_model=MatchData, tags=["Match"])
def fetch_match(
    match_id: str = Query(..., description="Full match ID including .nakama-0 suffix"),
    include_bots: bool = Query(True, description="Include bot player journeys"),
):
    """
    Load all player events for a given match.
    Returns player paths with world coordinates (x, z) and timestamps.
    """
    try:
        data = get_match_data(match_id=match_id, include_bots=include_bots)
        if not data:
            raise HTTPException(status_code=404, detail=f"Match '{match_id}' not found.")
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Backend Error: {str(e)}")


@app.get("/api/heatmap", response_model=List[HeatmapPoint], tags=["Heatmap"])
def fetch_heatmap(
    date: Optional[str] = Query(None, description="Filter by date folder"),
    map_id: Optional[str] = Query(None, description="Filter by map"),
    event_type: Optional[str] = Query(None, description="Specific event type (e.g. Kill, Loot)"),
):
    """
    Return aggregated event positions for heatmap rendering.
    By default, excludes raw Position/BotPosition events to focus on combat/loot.
    """
    return get_heatmap(date=date, map_id=map_id, event_type=event_type)


@app.get("/api/stats", response_model=MatchStats, tags=["Match"])
def fetch_stats(
    match_id: str = Query(..., description="Full match ID including .nakama-0 suffix"),
):
    """Return summary statistics for a match (kills, loots, deaths, duration)."""
    try:
        stats = get_match_stats(match_id=match_id)
        if not stats:
            raise HTTPException(status_code=404, detail=f"Match '{match_id}' not found.")
        return stats
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Backend Error: {str(e)}")


@app.get("/api/health", tags=["System"])
def health():
    return {"status": "ok", "version": "1.0.0"}
