# Clipora

A personal-use web application that converts long-form podcast videos into short, high-quality clips optimized for YouTube Shorts, TikTok, and Instagram Reels.

## Tech Stack

- **Frontend**: Next.js 15 + React 19 + Tailwind CSS + TypeScript
- **Backend**: FastAPI + Python 3.12
- **Database**: SQLite (via SQLAlchemy async)
- **Media**: FFmpeg
- **Transcription**: Whisper / faster-whisper
- **Retrieval**: yt-dlp, youtube-transcript-api
- **Dev Environment**: Docker Compose

## Project Structure

```
clipora/
  backend/          FastAPI application
    app/
      api/v1/       Versioned API endpoints
      core/         Config, database setup
      models/       SQLAlchemy ORM models
      schemas/      Pydantic request/response schemas
      services/     Business logic
      utils/        Helpers
    requirements.txt
    Dockerfile
  frontend/         Next.js application
    src/
      app/          App Router pages
      components/   Reusable UI components
        layout/     AppShell, Sidebar, Topbar, PageHeader
      lib/          API client, utilities
    package.json
    Dockerfile
  data/             Local media and database storage
  docker-compose.yml
  .env.example
```

## Quick Start

### Prerequisites

- Docker and Docker Compose
- (Optional) Node.js 22+ and Python 3.12+ for local development without Docker

### Running with Docker Compose

1. Clone the repository and enter the project directory:

   ```bash
   cd clipora
   ```

2. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

3. Start both services:

   ```bash
   docker compose up --build
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/docs
   - Health check: http://localhost:8000/api/v1/health

### Running Locally (without Docker)

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Documentation

Once the backend is running, interactive API docs are available at:

- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/episodes` | List episodes |
| POST | `/api/v1/episodes/import/youtube` | Import from YouTube URL |
| GET | `/api/v1/episodes/{id}/transcript` | Get transcript segments |
| GET | `/api/v1/episodes/{id}/highlights` | Get highlight candidates |
| POST | `/api/v1/clips` | Create a clip |
| GET | `/api/v1/clips/{id}` | Get clip details |
| POST | `/api/v1/clips/{id}/preview-render` | Queue preview render |
| POST | `/api/v1/clips/{id}/final-render` | Queue final export |
| GET | `/api/v1/presets/export` | List export presets |

## Data Storage

All media files and the SQLite database are stored in the `data/` directory:

```
data/
  clipora.db                        SQLite database
  episodes/{episode_id}/source/     Source video files
  episodes/{episode_id}/audio/      Extracted audio
  episodes/{episode_id}/transcript/ Transcript artifacts
  episodes/{episode_id}/analysis/   Analysis results
  episodes/{episode_id}/clips/      Clip source segments
  episodes/{episode_id}/previews/   Preview renders
  episodes/{episode_id}/exports/    Final exports
```

## Development Notes

- The backend uses async SQLAlchemy with SQLite for the MVP
- All API responses follow a consistent `{success, data}` or `{success, error}` shape
- The frontend uses a dark theme with indigo accent, designed for a calm editing-tool aesthetic
- Design tokens are defined in Tailwind config and CSS custom properties

## Roadmap

See `project_docs_suite.md` for the full PRD, design system spec, API spec, database schema, and sprint plan.

Current phase: **Sprint 0 — Project Setup**
