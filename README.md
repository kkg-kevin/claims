# Digifunzi Claims Dashboard

Digifunzi Claims Dashboard is a React single-page application for tutors to track teaching sessions, monitor student progress, manage session assignments and reports, and submit payment claims for completed work.

The project is currently a frontend prototype backed by in-memory mock data in `src/app/App.tsx`. It is ready for UI iteration and can later be connected to a backend API for real courses, attendance records, invoices, and claim approval workflows.

## Features

- Course claims overview with total claimable amount, outstanding claims, paid invoices, and tracked teaching hours.
- Course filtering by claim status: all, pending, advance claimed, approved, and denied.
- Course detail view with session progress, student attendance, assignment status, and report status.
- Per-session attendance toggles for each student.
- Assignment workflow states: issued, submitted, and graded.
- Report workflow with editable student report content and done/pending status.
- Invoice view with completed session breakdown, hourly/session rates, advance claims, full claims, remaining balance, and uploaded invoice file preview/download.
- Claim status badges for not requested, advance claimed, full claimed, approved, and denied.
- Responsive UI built with React, Tailwind CSS, Radix-style UI primitives, and Lucide icons.

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS 4
- Lucide React icons
- Radix UI component primitives
- MUI packages are installed, though the current main UI primarily uses Tailwind and Lucide

## Project Structure

```text
claims/
|-- index.html
|-- package.json
|-- package-lock.json
|-- pnpm-workspace.yaml
|-- vite.config.ts
|-- default_shadcn_theme.css
`-- src/
    |-- main.tsx
    |-- app/
    |   |-- App.tsx
    |   `-- components/
    |       |-- figma/
    |       `-- ui/
    `-- styles/
        |-- fonts.css
        |-- globals.css
        |-- index.css
        |-- tailwind.css
        `-- theme.css
```

## Key Files

- `src/main.tsx` mounts the React app and imports global styles.
- `src/app/App.tsx` contains the current application UI, mock data, domain types, helper calculations, and view logic.
- `src/app/components/ui/` contains reusable UI primitives generated in a shadcn/Radix style.
- `src/styles/index.css` imports fonts, Tailwind, and theme styles.
- `src/styles/theme.css` contains theme tokens used by the interface.
- `vite.config.ts` configures Vite, React, Tailwind, the `@` alias, and a `figma:asset/` resolver.

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm, or pnpm if you prefer using the included workspace file

### Install Dependencies

Using npm:

```bash
npm install
```

Using pnpm:

```bash
pnpm install
```

### Start Development Server

Using npm:

```bash
npm run dev
```

Using pnpm:

```bash
pnpm dev
```

Vite will print a local development URL, usually `http://localhost:5173/`.

### Build for Production

Using npm:

```bash
npm run build
```

Using pnpm:

```bash
pnpm build
```

The production build is generated in `dist/`.

## Application Workflow

1. The user lands on the "My Claims" dashboard.
2. Summary cards show claimable earnings, outstanding amounts, paid invoices, and total tracked hours.
3. The user filters courses by claim status.
4. Selecting a course opens its detail view.
5. The course detail view shows session completion, student attendance, assignment state, and report state.
6. The user can open per-session assignment and report pages.
7. The invoice view calculates claim totals from completed sessions and the course location rate.
8. The user can request an advance claim or a full payment claim, optionally attaching an invoice file.

## Domain Model

The main domain types are defined in `src/app/App.tsx`.

- `Course`: a teaching course/cohort with students, sessions, assignments, reports, attendance, invoices, and claim state.
- `Student`: a learner attached to a course.
- `Session`: one teaching session with number, date, duration, and attended state.
- `StudentSessionAttendance`: per-student attendance for a specific session.
- `StudentSessionAssignment`: per-student assignment progress for a specific session.
- `StudentSessionReport`: per-student report completion and content for a specific session.
- `InvoiceDoc`: uploaded invoice metadata.
- `ClaimStatus`: the payment lifecycle state for a course.

## Claim and Earnings Logic

Claim calculations are currently handled in `src/app/App.tsx`.

- Physical, center, and home sessions use a rate of `KSh 904`.
- Online and Google Meet sessions use a rate of `KSh 500`.
- Total earnings are calculated from attended/completed sessions and session duration.
- Advance claims are calculated as 50% of the total earning.
- Full claims become available when a course reaches full completion.
- Completion combines attendance, graded assignments, and completed reports.

Because this logic is currently client-side, it should be moved to a backend or shared validation layer before production use.

## Mock Data

The app uses `INITIAL_COURSES` in `src/app/App.tsx` to simulate real Digifunzi teaching data. The mock data includes multiple courses with different:

- locations and delivery modes
- student lists
- session counts and durations
- assignment/report completion states
- claim statuses
- advance payment amounts

To connect real data, replace `INITIAL_COURSES` with data loaded from an API.

Suggested future API layer:

```text
src/
`-- lib/
    |-- api.ts
    `-- types.ts
```

Example:

```ts
export async function fetchCourses() {
  const response = await fetch("/api/courses");

  if (!response.ok) {
    throw new Error("Failed to load courses");
  }

  return response.json();
}
```

## Styling and UI

The interface uses Tailwind utility classes with design tokens from the local style files. The visual language is dashboard-focused: compact cards, status chips, tables, progress indicators, and icon-led actions.

Important styling files:

- `src/styles/index.css`
- `src/styles/tailwind.css`
- `src/styles/theme.css`
- `default_shadcn_theme.css`

Reusable UI primitives live in `src/app/components/ui/`. Prefer using or extending those components before introducing a new UI library pattern.

## Vite Configuration

`vite.config.ts` includes:

- React plugin
- Tailwind CSS Vite plugin
- `@` alias mapped to `src`
- custom `figma:asset/` resolver for files under `src/assets`
- support for raw `.svg` and `.csv` asset imports

If you import assets with `figma:asset/<filename>`, the file should exist in `src/assets/`.

## Current Limitations

- Data is not persisted after a page refresh.
- There is no backend authentication or authorization.
- Claim approval is simulated by local state only.
- Invoice files are represented with browser object URLs and are not uploaded to a server.
- Tests, linting, and formatting scripts are not currently configured.
- `App.tsx` contains most of the application logic and should be split into smaller modules as the project grows.

## Recommended Next Steps

- Move domain types into `src/lib/types.ts`.
- Move calculation helpers into `src/lib/claims.ts`.
- Add an API layer in `src/lib/api.ts`.
- Split `App.tsx` into feature components such as `Dashboard`, `CourseDetail`, `InvoiceView`, `AttendanceView`, `AssignmentsView`, and `ReportsView`.
- Add persistence through a backend or local storage.
- Add Vitest and React Testing Library for component and calculation tests.
- Add ESLint and Prettier for consistent code quality.

## Available Scripts

```bash
npm run dev
npm run build
```

Equivalent pnpm commands:

```bash
pnpm dev
pnpm build
```

## Deployment

This is a standard Vite application. After running `npm run build` or `pnpm build`, deploy the generated `dist/` directory to any static hosting platform such as Vercel, Netlify, GitHub Pages, or a custom web server.

For production, connect the app to a secure backend before relying on it for real payment claims or invoice handling.
