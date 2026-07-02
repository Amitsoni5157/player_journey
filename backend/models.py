from pydantic import BaseModel
from typing import List, Optional


class PlayerEvent(BaseModel):
    ts: float          # milliseconds within match
    x: float
    z: float
    event: str


class PlayerJourney(BaseModel):
    user_id: str
    is_bot: bool
    color: str         # assigned hex color for rendering
    events: List[PlayerEvent]


class MatchData(BaseModel):
    match_id: str
    map_id: str
    players: List[PlayerJourney]
    min_ts: float
    max_ts: float


class MatchSummary(BaseModel):
    match_id: str
    map_id: str
    date: str
    human_count: int
    bot_count: int
    total_events: int


class HeatmapPoint(BaseModel):
    x: float
    z: float
    weight: float


class MatchStats(BaseModel):
    match_id: str
    map_id: str
    human_count: int
    bot_count: int
    kills: int
    bot_kills: int
    deaths: int
    loots: int
    storm_deaths: int
    duration_ms: float
