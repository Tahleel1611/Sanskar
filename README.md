# Eco Companion

> A carbon footprint tracker and sustainability companion app built with React, TypeScript, and Supabase.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript) ![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite) ![Supabase](https://img.shields.io/badge/Supabase-green?logo=supabase) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss)

## Overview

Eco Companion helps users track transport-related carbon emissions, learn eco-friendly habits through missions, scan products with the Carbon Lens feature, and participate in community sustainability challenges.

## Features

- **Dashboard** — real-time carbon score and weekly chart
- **Activity Tracking** — log transport and daily activities
- **Carbon Lens / Scanner** — scan items to estimate carbon footprint (ML-powered)
- **Learn** — bite-sized eco education missions
- **Community** — leaderboard and shared sustainability goals
- **Alternative Chooser** — discover lower-carbon alternatives
- **AI Advisor** — personalized eco suggestions
- **Profile & Settings** — user preferences and onboarding questionnaire

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS + shadcn/ui |
| Backend / Auth | Supabase |
| ML Model | Python (scikit-learn, see `ml/`) |
| Testing | Vitest + Testing Library |

## Project Structure

```
src/
  components/   # Reusable UI components
  pages/        # Route-level page components
  hooks/        # Custom React hooks
  integrations/ # Supabase client setup
  lib/          # Utilities (onboarding, etc.)
  assets/       # Static assets
ml/             # Python ML model for Carbon Lens
supabase/       # Supabase migrations and config
public/         # Static public files
```

## Prerequisites

- Node.js 20+
- npm
- A [Supabase](https://supabase.com) project

## Local Setup

1. **Clone the repo:**
   ```bash
   git clone https://github.com/Tahleel1611/Sanskar.git
   cd Sanskar
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Fill in `.env` with your Supabase project values:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |

## ML Model (Carbon Lens)

The `ml/` folder contains a Python script (`build_model.py`) and a pre-trained model (`carbon_model.json`) used by the Carbon Lens scanner to estimate the carbon footprint of scanned items.

To retrain the model:
```bash
cd ml
python build_model.py
```

## Notes

- App routes are protected behind Supabase auth; unauthenticated users are redirected to `/auth`.
- The app validates Supabase env vars on startup and throws a clear error if missing.
- Do **not** commit your `.env` file — it is gitignored. Use `.env.example` as a reference.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT