# Manasu - Emotional Wellness App

## Overview
Manasu is an emotional wellness application designed to help users identify, refine, and reflect on their feelings through a guided Emotion Wheel interface. By selecting their emotions across three tiers (Core → Secondary → Specific), users receive personalized, LLM-generated quotes and reflections to help them process their current emotional state.

## Project Structure
The project is a full-stack application featuring a modern React frontend and a robust Python backend.

- `frontend/`: Next.js web application with a premium, minimalist dark-mode UI.
- `backend/`: FastAPI backend handling data persistence, session management, and AI integrations.

## Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (React 19)
- **Styling**: Tailwind CSS with custom micro-interactions and dynamic lighting aesthetics
- **Animations**: Framer Motion for smooth transitions and progressive disclosure
- **Database ORM**: Drizzle ORM
- **Visualizations**: D3.js

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python >= 3.11)
- **Database**: PostgreSQL (via Asyncpg)
- **ORM**: SQLAlchemy 2.0 (asyncio)
- **AI Integration**: OpenAI (for generating personalized quotes and reflections)
- **Task Scheduling**: APScheduler (for recurring background tasks)
- **Dependency Management**: `uv`

## Core Features

- **Progressive Emotion Check-in**: A fluid 3-step UI flow guiding users from a primary (Core) emotion to a refined (Secondary/Tertiary) feeling.
- **Dynamic Aesthetics**: Highly interactive UI with tactile spring animations, dynamic color mixing based on the active emotion, and glassmorphism elements.
- **Personalized Reflections**: Generates tailored quotes and insights using OpenAI's models based on the exact path of the user's emotional state.
- **Session Tracking**: Records user sessions and emotional journeys in the database for continuity and analytics.
- **Therapist Integration**: Extensible backend routes (`/therapist`) to allow for professional oversight and progress tracking.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.11+)
- PostgreSQL Database (e.g., Neon Serverless)
- OpenAI API Key

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment (recommended to use `uv`):
   ```bash
   uv venv
   # On Windows
   .venv\Scripts\activate
   # On macOS/Linux
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   uv pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend/` directory with the necessary keys (Database URL, OpenAI API Key, etc.).
5. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the required environment variables (matching `drizzle.config.ts` and backend API endpoints).
4. Run the Next.js development server:
   ```bash
   npm run dev
   ```

## Emotion Hierarchy
The application uses a deeply mapped Emotion Wheel classification:
- **Core Emotions**: Bad, Afraid, Angry, Disgust, Sad, Happy, Surprise.
- **Secondary Emotions**: More specific variations (e.g., Sad → Vulnerable, Happy → Proud).
- **Tertiary Emotions**: Deeply specific feelings (e.g., Sad → Vulnerable → Fragile).

This hierarchy is strictly typed and mirrored across both the frontend configuration (`emotions.json` / `emotions.ts`) and backend DB models (`models.py`) to ensure consistency.
