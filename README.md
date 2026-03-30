<div align="center">

# Excalidraw Converter

**Turn text, files, and images into editable Excalidraw diagrams with AI.**

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![Claude Agent SDK](https://img.shields.io/badge/Claude_Agent_SDK-0.2-orange)](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org)

[Demo](#demo) | [Quick Start](#quick-start) | [How It Works](#how-it-works) | [Contributing](#contributing)

</div>

---

## The Problem

Creating diagrams is tedious. You open a drawing tool, drag shapes, connect lines, align everything... for something that took 10 seconds to describe in words.

## The Solution

Describe your diagram in plain text. Or upload a file. Or paste an image. Excalidraw Converter uses the Claude Agent SDK to understand your input and generate a fully editable Excalidraw diagram in seconds.

<!--
TODO: Replace with actual demo GIF
![Demo](docs/demo.gif)
-->

## Demo

> **Coming soon**: Live demo at [excalidraw-converter.vercel.app](#)
>
> In the meantime, clone and run locally in under 60 seconds.

## Features

| Input | What It Does |
|-------|-------------|
| **Text** | Describe a flowchart, architecture diagram, or any visual — AI generates it |
| **Files** | Upload Markdown, CSV, JSON, HTML, or XML — automatically parsed into diagrams |
| **Images** | Upload PNG, JPEG, GIF, or WebP — converted to editable vector elements |

**Plus:**
- Full Excalidraw editor with pan, zoom, and editing
- Resizable sidebar for comfortable input
- Local storage persistence — your work survives page refreshes
- Client-side timeout handling with clear error messages

## Quick Start

**Prerequisites**: Node.js 18+ and [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) (authenticated via OAuth)

```bash
git clone https://github.com/cskwork/excalidraw-converter.git
cd excalidraw-converter
npm install
npm run dev
```

Open http://localhost:3000 — that's it.

## How It Works

```
User Input (text / file / image)
        |
        v
  /api/convert route
        |
        v
  Claude Agent SDK
  (analyzes input, generates
   Excalidraw JSON elements)
        |
        v
  Validation + Auto Layout
        |
        v
  Excalidraw Editor
  (fully editable output)
```

1. You provide input via the sidebar (text description, file upload, or image upload)
2. The input is sent to the `/api/convert` API route
3. Claude Agent SDK analyzes your input and generates structured Excalidraw elements
4. Elements are validated, auto-laid out for readability, and rendered in the Excalidraw editor
5. You can edit, export, or share the result — it's a real Excalidraw diagram

## Tech Stack

| Technology | Role |
|-----------|------|
| [Next.js 15](https://nextjs.org) | App Router, API routes |
| [React 19](https://react.dev) | UI components |
| [Tailwind CSS](https://tailwindcss.com) | Styling |
| [Excalidraw](https://github.com/excalidraw/excalidraw) | Diagram editor |
| [Claude Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk) | AI-powered conversion |
| [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev) | Unit + E2E testing |

## Use Cases

- **Software Architecture**: "Draw a microservices architecture with API gateway, 3 services, and a database"
- **Flowcharts**: "Create a user authentication flow with login, 2FA, and password reset"
- **Data Visualization**: Upload a CSV and get a visual representation
- **Image to Editable**: Screenshot a whiteboard photo and convert it to clean, editable shapes
- **Documentation**: Convert Markdown documentation into visual diagrams

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

See [open issues](https://github.com/cskwork/excalidraw-converter/issues) for ideas on what to work on.

## License

MIT -- see [LICENSE](LICENSE) for details.

---

<div align="center">

**If this project saves you time, consider giving it a star.**

Built with [Excalidraw](https://excalidraw.com) and [Claude Agent SDK](https://docs.anthropic.com/en/docs/claude-code).

</div>
