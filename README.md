# Player Journey Visualization Tool

Welcome to the LILA BLACK Player Journey viewer! This tool allows Level Designers to easily load, filter, and play back massive amounts of production gameplay data (movement, kills, deaths, loot) directly on our minimaps.

Markdown
# 🚀 Live Deployment Links
- **Frontend (UI):** https://lila-black-player-journey.vercel.app/
- **Backend (API):** https://lila-player-journey-api-wg51.onrender.com



## 🛠 Tech Stack

* **Backend:** Python 3.10+, FastAPI, DuckDB (for insanely fast parquet querying)
* **Frontend:** React, Vite, HTML5 Canvas API (for 60fps drawing of thousands of player dots)

---

## 🚀 Local Setup Instructions

You'll need two terminal windows to run this project locally (one for the backend, one for the frontend).

### 1. Backend Setup (FastAPI)

The backend handles reading the raw `.parquet` data files via DuckDB and exposing them via a fast REST API.

```bash
# 1. Navigate to the backend directory
cd backend

# 2. (Optional but recommended) Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Start the server
uvicorn main:app --reload
```
*The backend is now running on `http://localhost:8000`.*

### 2. Frontend Setup (React/Vite)

The frontend is a fast React app that plots the API data onto the Canvas.

```bash
# 1. Open a new terminal and navigate to the frontend directory
cd frontend

# 2. Install NPM dependencies
npm install

# 3. Start the Vite development server
npm run dev
```
*The frontend is now accessible at `http://localhost:5173`. Open this in your browser to use the tool!*

---

## 🌍 Environment Variables (Deployment)

Currently, the application runs perfectly out of the box locally without any `.env` files. 

If you are deploying this to a production environment (like Vercel, Railway, or Render), you will need to add a `.env` file to your `frontend/` directory so it knows where the backend lives.

Create a `.env` file in the `frontend` folder with the following format:

```env
# URL of your deployed FastAPI backend
VITE_API_BASE_URL=https://lila-player-journey-api-wg51.onrender.com
```

*Note: Make sure your deployed backend sets up CORS properly to accept requests from your deployed frontend domain!*

---

## 🎥 Project Walkthrough

Watch the complete, smooth feature walkthrough video on Loom:
👉 **https://www.loom.com/share/506c52360f0e42f78b332fc6e5b4ef30**

---

## 📁 Directory Structure

```text
player_journey/
├── backend/            # FastAPI server, data loading logic (DuckDB), models
├── frontend/           # React application, UI components, Canvas rendering logic
├── player_data/        # The raw Parquet gameplay files, grouped by date
├── minimaps/           # High-resolution minimap background images
├── ARCHITECTURE.md     # Breakdown of the tech stack, coordinate math, and tradeoffs
└── INSIGHTS.md         # 3 actionable level design insights gathered using this tool
```
