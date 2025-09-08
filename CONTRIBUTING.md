## Contributing

Thanks for your interest in contributing! Please:

- Use npm (no yarn/pnpm). Commit `package-lock.json` inside `mobile/` and `api/` only
- Keep PRs small and focused; avoid breaking changes
- Run checks locally:
  - `cd api && npm ci && npm run typecheck && npm run build`
  - `cd mobile && npm ci && npm run lint && npm run typecheck && npm test`
- Avoid secrets in code and history. Use envs and `.env.example`

We follow a conventional review process and require CI to pass.

