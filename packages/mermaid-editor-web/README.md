# @mermaid-js/mermaid-editor-web

**Vite + React + TypeScript** editor with:

- **Canvas** ([@xyflow/react](https://reactflow.dev/)): drag nodes, connect edges (handles), delete with Backspace/Delete. The graph is the source of truth for structure.
- **Mermaid source** (left): auto-generated `flowchart TD` text from the canvas. Read-only by default.
- **Mermaid preview** (bottom): same `mermaid.run` preview as before, driven by the generated text (or your draft while editing text).
- **Toolbar**: Add node, Reset, Copy Mermaid, Download `.mmd`, and **Edit Mermaid text** / **Apply** / **Cancel** for a minimal text round-trip.

## Text edit mode (limited parser)

**Apply** accepts only:

- Optional header line `flowchart TD`
- Rect nodes: `id[label]` or `id["quoted label"]`
- Diamond nodes: `id{text}` or `id{"quoted"}`
- Edges: `a --> b` and `a -->|label| b`

Unknown lines are rejected with an error. Parsed nodes get positions merged from the current canvas when ids match.

## Prerequisites

The `mermaid` workspace package resolves to built artifacts under `packages/mermaid/dist/`. If that folder is missing (for example after a fresh clone with `--ignore-scripts`), build from the repository root first:

```bash
pnpm install
pnpm build
```

(`pnpm install` runs the root `prepare` script, which normally builds the monorepo.)

## Install

From the **repository root**:

```bash
pnpm install
```

## Develop

From the **repository root**:

```bash
pnpm editor:web
```

Or with an explicit filter:

```bash
pnpm --filter @mermaid-js/mermaid-editor-web dev
```

The dev server defaults to port **5174** (see `vite.config.ts`).

## Production build

```bash
pnpm --filter @mermaid-js/mermaid-editor-web build
pnpm --filter @mermaid-js/mermaid-editor-web preview
```

If your shell’s `node` is older than **22.14** (see repo root `engines` / `.node-version`), `tsc` may fail when invoked by `pnpm`. Use a modern Node for installs and builds, or from this package directory run `bun --bun run build` so the toolchain runs under **Bun**.

## Notes

- The bundled **Mermaid** graph is still **re-laid out by Mermaid** in the preview; canvas positions are **not** written into the Mermaid string (only node ids, labels, shapes, and edges are).
- Full Mermaid syntax (subgraphs, `classDef`, etc.) is **not** supported by the visual editor or the minimal parser.
