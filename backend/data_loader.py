"""
data_loader.py
Handles all parquet reading, DuckDB queries, and data transformation
for the Player Journey visualization backend.
"""

import os
import re
import duckdb
import pandas as pd
from pathlib import Path
from typing import Optional

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "player_data"

# Date folder names in order
DATE_FOLDERS = ["February_10", "February_11", "February_12", "February_13", "February_14"]

# ── Player color palette (assigned round-robin to human players) ───────────────
PLAYER_COLORS = [
    "#6c63ff", "#ff6584", "#43e97b", "#f7971e", "#4facfe",
    "#fa709a", "#a8edea", "#fee140", "#30cfd0", "#667eea",
    "#f953c6", "#00c6ff", "#96e6a1", "#f6d365", "#fda085",
]
BOT_COLOR = "rgba(180,180,180,0.35)"

# ── UUID regex for human detection ───────────────────────────────────────────
UUID_PATTERN = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    re.IGNORECASE
)


def is_human(user_id: str) -> bool:
    return bool(UUID_PATTERN.match(str(user_id)))


def get_available_dates() -> list[str]:
    """Return date folders that actually exist on disk."""
    return [d for d in DATE_FOLDERS if (DATA_DIR / d).exists()]


def _build_match_index() -> dict:
    index = {}
    con = duckdb.connect()

    for date in get_available_dates():
        folder = DATA_DIR / date
        for fname in os.listdir(folder):
            filepath = folder / fname
            
            # Parse user_id and match_id from filename
            parts = fname.split("_", 1)
            if len(parts) != 2:
                continue
            
            uid = parts[0]
            match_id = parts[1]

            if match_id not in index:
                # Read map_id from this file
                try:
                    row = con.execute(
                        f"SELECT map_id FROM read_parquet('{filepath.as_posix()}') LIMIT 1"
                    ).fetchone()
                    map_id = row[0] if row else "Unknown"
                except Exception:
                    continue
                index[match_id] = {"date": date, "map_id": map_id, "files": []}

            index[match_id]["files"].append({
                "path": filepath,
                "user_id": uid
            })

    con.close()
    return index


# Cache the match index once at startup
_MATCH_INDEX: Optional[dict] = None


def get_match_index() -> dict:
    global _MATCH_INDEX
    if _MATCH_INDEX is None:
        _MATCH_INDEX = _build_match_index()
    return _MATCH_INDEX


def get_matches(date: Optional[str] = None, map_id: Optional[str] = None) -> list[dict]:
    """Return list of match summaries, optionally filtered by date and/or map."""
    index = get_match_index()
    results = []
    for match_id, info in index.items():
        if date and info["date"] != date:
            continue
        if map_id and info["map_id"] != map_id:
            continue

        human_count = 0
        bot_count = 0
        for f in info["files"]:
            if is_human(f["user_id"]):
                human_count += 1
            else:
                bot_count += 1

        results.append({
            "match_id": match_id,
            "map_id": info["map_id"],
            "date": info["date"],
            "human_count": human_count,
            "bot_count": bot_count,
            "total_events": human_count + bot_count,
        })

    # Sort by date then match_id
    results.sort(key=lambda r: (r["date"], r["match_id"]))
    return results


def get_match_data(match_id: str, include_bots: bool = True) -> Optional[dict]:
    """
    Load all events for a match. Returns structured dict for MatchData model.
    """
    index = get_match_index()
    if match_id not in index:
        return None

    info = index[match_id]
    files = info["files"]

    con = duckdb.connect()
    players = []
    color_idx = 0

    for f in files:
        uid = f["user_id"]
        filepath = f["path"]
        human = is_human(uid)

        if not include_bots and not human:
            continue

        try:
            df = con.execute(
                f"""
                SELECT
                    user_id,
                    x,
                    z,
                    ts,
                    event
                FROM read_parquet('{filepath.as_posix()}')
                ORDER BY ts
                """
            ).df()
        except Exception as e:
            print(f"Error reading file {filepath.name}: {e}")
            continue

        if df.empty:
            continue

        events = []
        try:
            for i, (_, row) in enumerate(df.iterrows()):
                ev = row["event"]
                if isinstance(ev, (bytes, bytearray)):
                    ev_str = ev.decode('utf-8', errors='ignore')
                else:
                    ev_str = str(ev)
                
                if ev_str.startswith("b'") and ev_str.endswith("'"):
                    ev_str = ev_str[2:-1]
                elif ev_str.startswith('b"') and ev_str.endswith('"'):
                    ev_str = ev_str[2:-1]

                # ts is actually a Unix timestamp in seconds (e.g. 1770760465).
                # DuckDB mistakenly parsed it as microseconds and returned 1970-01-21.
                # .timestamp() gives 1770760.465 seconds.
                # Multiply by 1,000,000 to get the original 1770760465000 milliseconds for the frontend!
                raw_ts = row["ts"]

                if pd.notna(raw_ts):
                    if hasattr(raw_ts, 'timestamp'):
                        ts_val = raw_ts.timestamp() * 1000000
                    else:
                        ts_val = float(raw_ts) * 1000
                else:
                    ts_val = 0.0

                x_val = row["x"] if pd.notna(row["x"]) else 0.0
                z_val = row["z"] if pd.notna(row["z"]) else 0.0

                events.append({
                    "ts": ts_val,
                    "x": float(x_val),
                    "z": float(z_val),
                    "event": ev_str,
                })
        except Exception as e:
            cols = list(df.columns)
            raise Exception(f"Row parsing error ({type(e).__name__}: {e}). Available columns: {cols}")

        color = PLAYER_COLORS[color_idx % len(PLAYER_COLORS)] if human else BOT_COLOR
        if human:
            color_idx += 1

        players.append({
            "user_id": uid,
            "is_bot": not human,
            "color": color,
            "events": events,
        })

    con.close()

    if not players:
        return {
            "match_id": match_id,
            "map_id": info["map_id"],
            "players": [],
            "min_ts": 0,
            "max_ts": 0,
        }

    # Compute ts range across all events
    all_ts = [e["ts"] for p in players for e in p["events"]]
    return {
        "match_id": match_id,
        "map_id": info["map_id"],
        "players": players,
        "min_ts": min(all_ts),
        "max_ts": max(all_ts),
    }


def get_heatmap(date: Optional[str], map_id: Optional[str], event_type: Optional[str]) -> list[dict]:
    """
    Return aggregated x,z positions for heatmap rendering.
    Bins into a grid and returns weight per cell.
    """
    index = get_match_index()
    con = duckdb.connect()

    # Collect all matching files
    file_paths = []
    for match_id, info in index.items():
        if date and info["date"] != date:
            continue
        if map_id and info["map_id"] != map_id:
            continue
        file_paths.extend([f["path"] for f in info["files"]])

    if not file_paths:
        con.close()
        return []

    # Build a glob-style list for DuckDB
    # DuckDB can read a list of files directly
    path_list = ", ".join([f"'{fp.as_posix()}'" for fp in file_paths[:200]])  # cap at 200 files

    event_filter = ""
    if event_type:
        event_filter = f"WHERE CAST(event AS VARCHAR) = '{event_type}'"
    else:
        # Exclude pure position events for heatmap — focus on actions
        event_filter = "WHERE CAST(event AS VARCHAR) NOT IN ('Position', 'BotPosition')"

    try:
        df = con.execute(
            f"""
            SELECT
                ROUND(x / 10) * 10 AS bx,
                ROUND(z / 10) * 10 AS bz,
                COUNT(*) AS cnt
            FROM read_parquet([{path_list}])
            {event_filter}
            GROUP BY bx, bz
            """
        ).df()
    except Exception as e:
        con.close()
        return []

    con.close()

    if df.empty:
        return []

    max_cnt = df["cnt"].max()
    return [
        {"x": float(row["bx"]), "z": float(row["bz"]), "weight": float(row["cnt"]) / max_cnt}
        for _, row in df.iterrows()
    ]


def get_match_stats(match_id: str, date: Optional[str] = None) -> Optional[dict]:
    """Return aggregated stats for a single match."""
    data = get_match_data(match_id, include_bots=True)
    if not data:
        return None

    kills = deaths = bot_kills = loots = storm_deaths = 0
    human_ids = set()
    bot_ids = set()

    for player in data["players"]:
        uid = player["user_id"]
        if player["is_bot"]:
            bot_ids.add(uid)
        else:
            human_ids.add(uid)
        for e in player["events"]:
            ev = e["event"]
            if ev == "Kill":
                kills += 1
            elif ev == "Killed":
                deaths += 1
            elif ev == "BotKill":
                bot_kills += 1
            elif ev == "Loot":
                loots += 1
            elif ev == "KilledByStorm":
                storm_deaths += 1

    return {
        "match_id": match_id,
        "map_id": data["map_id"],
        "human_count": len(human_ids),
        "bot_count": len(bot_ids),
        "kills": kills,
        "bot_kills": bot_kills,
        "deaths": deaths,
        "loots": loots,
        "storm_deaths": storm_deaths,
        "duration_ms": data["max_ts"] - data["min_ts"],
    }
