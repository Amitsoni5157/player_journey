# Architecture & Technical Decisions

Welcome to the guts of the Player Journey visualization tool. This document breaks down how the app works, why specific technologies were chosen, and how we solved the core challenge of mapping game coordinates to the screen.

## 1. What We Built With & Why

To keep things fast and maintainable, the stack is split into a lightweight Python backend and a React frontend. 

| Layer | Technology | Why we chose it | Tradeoffs |
| :--- | :--- | :--- | :--- |
| **Backend** | FastAPI + Python | Incredibly fast to write REST APIs, great ecosystem for data processing. | Not as statically safe as Go/Rust, but iteration speed is unmatched. |
| **Data Querying** | DuckDB | Reads `.parquet` files directly from disk via SQL. Perfect for aggregating heatmap data without blowing up RAM. | Adds a dependency compared to just using Pandas, but scales much better with large datasets. |
| **Frontend** | React + Vite | Fast HMR, standard component model for the sidebar/timeline UI. | React state overhead can cause lag if not careful with large arrays. |
| **Rendering** | HTML5 Canvas | Immediate-mode rendering. Drawing thousands of player position dots at 60fps is trivial for Canvas. | Harder to implement hover-tooltips compared to DOM/SVG nodes, requires manual redraws. |

## 2. Data Flow: From Parquet to Screen

We avoid loading the entire 5 days of data into memory at once. 

1. **Storage:** The `.parquet` files sit in a structured `player_data/` directory.
2. **Backend (DuckDB):** When the frontend requests a specific match, DuckDB executes a SQL query directly against the relevant parquet files. It extracts only the columns we care about (`user_id, x, z, ts, event`) and orders them by time.
3. **API (FastAPI):** The backend formats the data into JSON, separating "human" players from "bots" and grouping events into arrays.
4. **Frontend (React hooks):** The frontend fetches this JSON and stores it in memory.
5. **Canvas Render:** As the timeline slider ticks forward, the `<MinimapCanvas>` component clears the screen and redraws the background image, heatmap, and player paths up to the current timestamp.

## 3. Coordinate Mapping (The Tricky Part)

Taking a 3D world coordinate `(x, z)` and plotting it accurately onto a 2D minimap image requires translating "World Space" to "Image Space" to "Canvas Space". 

Here is exactly how the math works:

1. **Normalize to Percentages (`u, v`)**
   We take the player's world position, subtract the map's origin, and divide by the map's physical scale. This gives us a value between `0.0` and `1.0` (representing 0% to 100% across the map).
   ```javascript
   const u = (x - originX) / scale;
   const v = (z - originZ) / scale;
   ```

2. **Invert the Y-Axis**
   In game engines like Unity/Unreal, the Z-axis usually goes *up* (positive is North). But in HTML Canvas, the Y-axis goes *down* (0 is at the top). To fix this, we simply invert `v` by doing `(1 - v)`.

3. **Scale to Canvas Size**
   We multiply these percentages by the physical pixel size of our canvas viewport.
   ```javascript
   const px = u * canvasSize;
   const py = (1 - v) * canvasSize;
   ```
   *Result:* The world coordinate lands exactly where it should on the visual minimap.

## 4. Assumptions & Edge Cases Handled

While building this, the data had a few quirks that required explicit handling:

* **Bot Detection:** The dataset doesn't explicitly flag bots. I noticed human players had standard UUIDs (e.g., `83f936e1-a608-4a22...`), while bots had simple string names. We use a regex pattern on the `user_id` to reliably split humans from bots.
* **Timestamp Formatting:** The raw Parquet `ts` column was stored in Unix seconds (e.g., `1770760465`), but data parsers often mistake this for microseconds. I manually multiply the timestamp by `1000` to convert it to standard milliseconds so the frontend Timeline logic works flawlessly.
* **Bytes vs Strings:** Some event types in the parquet files were encoded as raw bytes (e.g., `b'Kill'`). The backend cleans these up, stripping the `b''` wrapper so the frontend just gets clean strings like `"Kill"`.
