# Layerkit — Motion Overlay Studio

Edit animated overlays (lower thirds, name cards, titles) in the browser and export them as **transparent video** for CapCut, Premiere, DaVinci Resolve and Final Cut.

Built with React + Vite + Tailwind + [Remotion](https://www.remotion.dev).

## Features (Phase 1 + 2)

- 3 templates: **Lower Third**, **Name Card**, **Big Title**
- Live preview with play/scrub controls
- One design → **16:9, 9:16, 1:1** (layout adapts automatically)
- Auto-generated editor form from each template's field list
- **Brand kit**: heading/body font, 4 colors, logo, quick palettes — applied to every template
- **Custom font upload** (.ttf .otf .woff .woff2) and **image upload** (photos, logos)
- Preview backdrops: sample footage, transparent checkerboard, black, white
- Project auto-saves in the browser

## Run locally

```bash
npm install
npm run dev          # editor at http://localhost:5173
```

## Render transparent video (until Phase 3 adds a button)

1. In the editor click **Export → Copy project JSON**, save it as `project.json` in this folder.
2. Run:

```bash
npx remotion render src/remotion/index.ts lower-third out/lower-third.mov --props=project.json
```

Output: ProRes 4444 `.mov` with alpha (defaults in `remotion.config.ts`).
For WebM with alpha: add `--codec=vp9 --pixel-format=yuva420p`.

## Add a new template

1. Create `src/templates/MyTemplate.tsx` that exports a `TemplateDef` (see `LowerThird.tsx`).
2. Add it to the `TEMPLATES` array in `src/templates/registry.ts`.

The editor, thumbnails, form and CLI render pick it up automatically.

## Project structure

```
src/
  editor/        editor UI (App, panels, preview, export dialog)
  templates/     animation templates + registry
  lib/           shared types, fonts, motion helpers
  remotion/      Remotion entry for CLI rendering
```

## Roadmap

- **Phase 3** — render server + one-click export (ProRes / WebM), progress bar
- **Phase 4** — template library page: categories, search, sort, favorites
- **Phase 5** — Google sign-in, credits, database (Supabase)

## License note

Remotion is free for individuals and small teams; companies may need a paid license. Check https://www.remotion.dev/license before commercial use.
