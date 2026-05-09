# Contributing to BombParty

## Before you start

- Open an issue first for non-trivial changes so we can align on approach.
- Check existing issues and pull requests before creating a duplicate.

## Setup

Follow the [Getting started](README.md#getting-started) section in the README.

Run backend tests before submitting:

```bash
cd backend && npm test
```

## Pull request checklist

- [ ] Backend tests pass (`cd backend && npm test`)
- [ ] Frontend builds without errors (`cd frontend && npm run build`)
- [ ] No hardcoded English or Turkish strings in frontend components — use `useT()`
- [ ] Turkish text comparisons use `normalizeTurkishLower`, not `.toLowerCase()`
- [ ] New Socket.io events are added to `EVENTS` in `socketManager.js` **and** `frontend/src/lib/socket.ts`
- [ ] No comments explaining *what* code does — only *why* if non-obvious

## Code style

- **Backend:** JavaScript ESM (no TypeScript). Explicit `.js` extensions on all imports.
- **Frontend:** TypeScript. `interface` over `type` for object shapes. All types in `src/types/game.ts`.
- **CSS:** Use `.bp-*` utility classes from `index.css` before reaching for arbitrary Tailwind utilities.
- No feature flags, backwards-compat shims, or dead code.
- No error handling for impossible cases — trust internal invariants.

## Commit messages

Use the imperative mood: `add feature`, `fix bug`, `update README`.  
Keep the subject line under 72 characters.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
