# Digifunzi Claims Dashboard

Digifunzi Claims Dashboard is a React single-page application for tutors to track teaching sessions, monitor student progress, manage session assignments and reports, and submit payment claims for completed work.

The project is currently a frontend prototype backed by in-memory mock data in `src/app/App.tsx`. It is ready for UI iteration and can later be connected to a backend API for real courses, attendance records, invoices, and claim approval workflows.

## Features

- Course claims overview with total claimable amount, outstanding claims, paid invoices, and tracked teaching hours.
- Course filtering by claim status: all, pending, advance claimed, approved, and denied.
- Course detail summary with course progress, amount payable, advance payable, and a primary request payment action.
- Integrated session table toolbar showing the active session, attendance percentage, assignment percentage, report percentage, and session navigation.
- Equal-width course detail workspace with the session table on the left and claim history on the right.
- Per-session attendance toggles for each student.
- Assignment workflow states: issued, submitted, and graded.
- Report workflow with editable student report content and done/pending status.
- Claim history panel showing requested, approved, paid, and rejected claim events.
- Rejected claims show the rejection reason.
- Request payment popup with a simple choice-first flow for advance requests and full payment requests.
- PDF-only invoice upload during claim submission.
- Full payment requests show the full course amount, and when an advance already exists they also show the remaining balance.
- Uploaded invoice files can be viewed after submission; they cannot be removed from the active request flow.
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
- `src/app/App.tsx` contains the current application UI, mock data, domain types, helper calculations, payment request popup, claim history, and view logic.
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
7. The right-side claim history panel shows previous requests and approval/rejection outcomes for the selected course.
8. The user opens the request payment popup from the course summary.
9. The popup shows estimated earnings, amount advanced, and amount claimed.
10. The user chooses either an advance request or full payment request.
11. Advance requests require advance amount, advance reason, and a PDF invoice.
12. Full payment requests require a PDF invoice and show either the full course amount or the balance after a previous advance.
13. Submitted requests are added to the course claim history as `Requested`.

## Domain Model

The main domain types are defined in `src/app/App.tsx`.

- `Course`: a teaching course/cohort with students, sessions, assignments, reports, attendance, invoices, and claim state.
- `Student`: a learner attached to a course.
- `Session`: one teaching session with number, date, duration, and attended state.
- `StudentSessionAttendance`: per-student attendance for a specific session.
- `StudentSessionAssignment`: per-student assignment progress for a specific session.
- `StudentSessionReport`: per-student report completion and content for a specific session.
- `InvoiceDoc`: uploaded invoice metadata.
- `PaymentActivity`: one claim-history event, including type, amount, status, date, optional note/reason, and invoice filename.
- `ClaimStatus`: the payment lifecycle state for a course.

## Claim and Earnings Logic

Claim calculations are currently handled in `src/app/App.tsx`.

- Physical, center, and home sessions use a rate of `KSh 904`.
- Online and Google Meet sessions use a rate of `KSh 500`.
- Total earnings are calculated from the payable course session count and the course location rate.
- Advance claims are calculated as 30% of the total earning.
- Advance requests become available when completion is at least 50% and less than 100%, and the course has not already requested a claim.
- Full claims become available when a course reaches full completion.
- Full payment requests use the full amount if no advance exists, or the remaining balance after an advance claim.
- Completion combines attendance, graded assignments, and completed reports.
- New mentor-submitted claims are recorded as `Requested`; paid/approved/rejected status is expected to come from a coordinator or backend workflow.

Because this logic is currently client-side, it should be moved to a backend or shared validation layer before production use.

## Mock Data

The app uses `INITIAL_COURSES` in `src/app/App.tsx` to simulate real Digifunzi teaching data. The mock data includes multiple courses with different:

- locations and delivery modes
- student lists
- session counts and durations
- assignment/report completion states
- claim statuses
- advance payment amounts

Useful seeded examples:

- `Robotics & Automation` is fully complete and ready for a full payment request.
- `Introduction to Coding` is advance-eligible and starts as `not_requested`.
- Some courses are already approved, denied, or partially claimed to demonstrate the dashboard filters and claim history states.

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

## Payment Request UI

The active request flow is intentionally compact:

- A popup opens from the `Request Payment` button in the course summary.
- A payout context row shows `Estimated earnings`, `Amount advanced`, and `Amount claimed`.
- The user chooses `Advance request` or `Request payment`.
- Advance request shows only advance amount, advance reason, and PDF upload.
- Payment request shows the full amount, plus remaining balance when an advance already exists.
- Upload accepts PDF files only.
- Confirming a request does not mark it as paid; it adds a requested item to claim history.

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
- Uploaded invoice files are viewable only during the current browser session.
- The UI does not currently include coordinator-side controls for approving, paying, or rejecting claims.
- Tests, linting, and formatting scripts are not currently configured.
- `App.tsx` contains most of the application logic and should be split into smaller modules as the project grows.

## Recommended Next Steps

- Move domain types into `src/lib/types.ts`.
- Move calculation helpers into `src/lib/claims.ts`.
- Add an API layer in `src/lib/api.ts`.
- Split `App.tsx` into feature components such as `Dashboard`, `CourseDetail`, `PaymentRequestView`, `ClaimHistoryPanel`, `AttendanceView`, `AssignmentsView`, and `ReportsView`.
- Add persistence through a backend or local storage.
- Add coordinator/admin workflows for approving, rejecting with reasons, and marking claims as paid.
- Replace browser object URLs with real invoice upload storage.
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
