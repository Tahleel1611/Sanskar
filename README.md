# Eco Companion

Eco Companion is a Vite + React + TypeScript app for tracking transport-related carbon impact, learning through missions, and participating in community sustainability features.

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Supabase (auth + backend)
- Vitest + Testing Library

## Prerequisites

- Node.js 20+
- npm

## Local Setup

1. Install dependencies:

	```sh
	npm install
	```

2. Create environment variables:

	```sh
	cp .env.example .env
	```

	On Windows PowerShell, use:

	```powershell
	Copy-Item .env.example .env
	```

3. Fill `.env` with your Supabase project values:

	- `VITE_SUPABASE_URL`
	- `VITE_SUPABASE_PUBLISHABLE_KEY`

4. Start the development server:

	```sh
	npm run dev
	```

## Scripts

- `npm run dev` - start Vite dev server
- `npm run build` - production build
- `npm run preview` - preview production build locally
- `npm run lint` - run ESLint
- `npm run test` - run Vitest once
- `npm run test:watch` - run Vitest in watch mode

## Notes

- App routes are protected behind auth; unauthenticated users are redirected to `/auth`.
- The app validates Supabase env vars on startup and throws a clear error if missing.
