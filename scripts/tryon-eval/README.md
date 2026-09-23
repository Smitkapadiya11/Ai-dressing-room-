# Try-on honesty eval

Checks that the mirror changes only the clothes and nothing about the person.

## 1. Add photos (consented only)
Put full-length `.jpg` photos into `photos/`. They are git-ignored and never committed. Suggested names, one per case:

| File | Case |
|---|---|
| `heavy-build-woman.jpg` | heavier build |
| `slim-build-man.jpg` | slim build |
| `dark-skin-woman.jpg` | dark skin |
| `fair-skin-man.jpg` | fair skin |
| `older-woman.jpg` | older person |
| `no-makeup-woman.jpg` | no-makeup face |

Every photo runs against a saree, a lehenga, a kurta (salwar kameez) and a shirt, so six photos means 24 real generations.

## 2. Run
```
npm run dev
npm run eval:tryon            # or: node scripts/tryon-eval/run.mjs --base https://your-deploy
```
Open `out/report.html`. For each row, check the face, the skin tone and body size against the input, that no makeup was added, and that the garment's colour and print are exact.

## Guardrails (log-only, never block)
- **Build drift:** each result is sent back through `/api/verify` against the body read of the input. Rows whose build doesn't match are flagged in red.
- **Not yet built:** a face-embedding similarity score and a skin-region colour difference. Both need an image-processing dependency, and are listed in `docs/CONTENT_TODO.md`.
