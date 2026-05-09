## Summary

<!-- What does this PR do? One or two sentences. -->

## Changes

<!-- Bullet list of what changed and why. -->

## Checklist

- [ ] Backend tests pass (`cd backend && npm test`)
- [ ] Frontend builds without errors (`cd frontend && npm run build`)
- [ ] No hardcoded strings — all user-visible text goes through `useT()`
- [ ] Turkish text comparisons use `normalizeTurkishLower`
- [ ] New Socket.io events added to both `EVENTS` objects (backend + frontend)
