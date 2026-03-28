# Excalidraw Converter

Turn text, files, and images into editable [Excalidraw](https://excalidraw.com) diagrams using AI.

## Features

- **Text to Diagram** — Describe what you want and get an Excalidraw diagram
- **File to Diagram** — Upload Markdown, CSV, JSON, HTML, or XML files
- **Image to Diagram** — Upload images (PNG, JPEG, GIF, WebP) and convert them to editable diagrams
- **Interactive Editor** — Full Excalidraw editor with pan, zoom, and editing
- **Resizable Sidebar** — Drag to resize the input panel

## Tech Stack

- [Next.js 15](https://nextjs.org) (App Router)
- [React 19](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Excalidraw](https://github.com/excalidraw/excalidraw) — Diagram editor
- [Claude Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk) — AI-powered conversion
- [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev) — Testing

## Prerequisites

- Node.js 18+
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated (OAuth)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |

## How It Works

1. User provides input (text, file, or image) via the sidebar
2. Input is sent to the `/api/convert` route
3. The API uses the Claude Agent SDK to analyze the input and generate Excalidraw elements
4. Elements are validated, auto-laid out, and rendered in the Excalidraw editor

## License

MIT
