# PrepCraft

> Craft your way to ready.

PrepCraft is a preparation and tracking workspace for:
- DSA preparation
- Coding practice & revision
- Mistake tracking & pattern recognition
- Java and CS fundamentals
- Aptitude & study planning
- Readiness & interview preparation tracking
- Project preparation & application tracking
- Progress analytics

## Tech Stack
- **Framework**: Next.js (App Router, Turbopack)
- **Language**: TypeScript (Strict)
- **Styling**: Tailwind CSS & CSS Variables
- **UI Components**: shadcn/ui
- **Icons**: Hugeicons
- **Database / Auth**: Supabase SSR
- **State Management**: TanStack Query
- **Data Tables**: TanStack Table
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest & Playwright

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Copy the environment variables:
```bash
cp .env.example .env.local
```

3. Run the development server (configured on port **3030**):
```bash
npm run dev
```

Open [http://localhost:3030](http://localhost:3030) with your browser.

## Scripts

- `npm run dev` — Start dev server on port 3030
- `npm run build` — Create production build
- `npm run start` — Start production server on port 3030
- `npm run lint` — Run ESLint
- `npm run typecheck` — Run TypeScript type checking
- `npm run test` — Run Vitest unit tests
- `npm run test:e2e` — Run Playwright end-to-end tests
