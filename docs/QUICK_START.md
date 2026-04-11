# 🏃 Quick Start — Komic Freaks Studio

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org))
- **Git** ([Download](https://git-scm.com))
- **ElevenLabs API Key** ([Sign up](https://elevenlabs.io)) — free tier available

## Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd "Komic Freaks"

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and add your ElevenLabs API key

# 4. Start the dev server
npm run dev
```

The app will open at `http://localhost:5173`

## Key Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run linter |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_ELEVENLABS_API_KEY` | ElevenLabs API key for AI narration | Yes (for narration feature) |

## Project Structure

```
src/
├── components/    # React components (Editor, Timeline, etc.)
├── services/      # API clients (ElevenLabs, FFmpeg)
├── hooks/         # Custom React hooks
├── stores/        # State management
├── styles/        # CSS design system
├── utils/         # Helper functions
├── App.jsx        # Main app component
└── main.jsx       # Entry point
```
