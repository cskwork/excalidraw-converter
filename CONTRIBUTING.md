# Contributing to Excalidraw Converter

Thanks for your interest in contributing. This guide covers everything you need to get started.

## Development Environment Setup

**Prerequisites:** Node.js 18+ and npm.

```bash
git clone https://github.com/cskwork/excalidraw-converter-marketing.git
cd excalidraw-converter-marketing
npm install
npm run dev
```

The dev server starts at `http://localhost:3000`.

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# With coverage report
npm run test:coverage
```

Unit and component tests use **Vitest** with **Testing Library**. End-to-end tests use **Playwright**.

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npx playwright test
```

## Linting

```bash
npm run lint
```

ESLint is configured via `eslint-config-next`. Fix any lint errors before submitting a PR.

## Code Style

- **TypeScript** -- strict mode is enabled. Use explicit types; avoid `any`.
- **Tailwind CSS** -- use utility classes for styling. Avoid writing custom CSS unless Tailwind cannot express what you need.
- **File organization** -- keep files small and focused. Place source code under `src/` and tests under `tests/`.
- **Path aliases** -- use `@/*` to import from `src/` (e.g., `import { foo } from '@/lib/foo'`).
- **Formatting** -- match the existing style in the codebase. Consistent indentation (2 spaces), single quotes for strings in JS/TS.

## Pull Request Process

1. **Fork** the repo and create a feature branch from `main`.
2. Make your changes in small, focused commits.
3. Ensure `npm run lint` and `npm test` pass locally.
4. Open a PR against `main` with a clear title and description.
5. Describe what changed and why. Include screenshots for UI changes.
6. A maintainer will review your PR. Address feedback promptly.

Keep PRs small. One concern per PR is ideal.

## Good First Issues

Look for issues labeled **good first issue** in the GitHub issue tracker. These are scoped to be approachable for newcomers to the codebase.

## Code of Conduct

Be respectful and constructive in all interactions -- issues, PRs, code reviews, and discussions. Harassment, discrimination, and hostile behavior are not tolerated. We are here to build good software together.
