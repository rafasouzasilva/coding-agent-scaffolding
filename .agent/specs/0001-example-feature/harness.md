# Harness: Example Feature

## Acceptance criteria

- [ ] BR-1: Signup integration test asserts redirect to `/welcome`
- [ ] BR-2: `/welcome` renders exactly three `.suggestion` elements
- [ ] BR-3: Test covers each configured role mapping
- [ ] BR-4: Dismissal persists across reloads (e2e test)
- [ ] BR-5: Empty-state redirect covered by integration test

## Executable checks

- `pnpm test src/features/welcome` — unit + integration pass
- `pnpm test:e2e welcome` — e2e suite passes

## Out-of-band checks

- Manual: confirm welcome copy matches design in Figma frame `welcome-v1`

## Rollback plan

Behind feature flag `welcome_v1`. Disable in config to revert to old
post-signup redirect.
