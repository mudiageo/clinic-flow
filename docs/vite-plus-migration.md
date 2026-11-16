# Vite+ Migration

The project moved from the standalone Vite/Vitest/ESLint/Prettier toolchain to
[Vite+](https://viteplus.dev) 1.6 (`vp`). `vp migrate` did the bulk of the rewrite; this
document records what it changed and the manual decisions needed to finish the job.

## What `vp migrate` changed

- `package.json` scripts now use `vp dev`, `vp build`, `vp preview`, `vp test`, `vp lint`
  and `vp fmt`, and `db:seed` uses `vpx`.
- Vite/Vitest come from the pnpm catalog (`@voidzero-dev/vite-plus-core` 1.6, Vitest 5.1).
- ESLint and Prettier dependencies, `eslint.config.js` and `prettier.config.js` were removed.
  The old `.oxlintrc.json` was merged into the `lint` block of `vite.config.ts`; formatting
  options moved into the `fmt` block.
- Oxfmt replaced Prettier (`eslint`/`prettier` editor recommendations were dropped and the
  Oxc formatter is now the workspace default formatter).
- Vitest 5 rewrote test imports to `vite-plus/test` and browser imports to
  `vite-plus/test/browser`, awaited `render`, and uses `toMatchTextContent` for browser text
  assertions.
- A Vite+ dispatcher was installed in `.vite-hooks/_` (generated, ignored). The project-owned
  `.vite-hooks/pre-commit` is tracked.
- Git hooks run `vp staged`; the `staged` rules live in `vite.config.ts`.

## Manual decisions

### Lint split: Oxlint + Oxvelte

Oxlint lints JavaScript/TypeScript and the `<script>` blocks of `.svelte` files, but it does
not lint Svelte templates, styles or component semantics. Those are covered by
[Oxvelte](https://github.com/tolgaouz/oxvelte), a native drop-in replacement for
`eslint-plugin-svelte`.

- Svelte rule policy lives in `oxvelte.config.json`. It mirrors the rule list previously
  configured for `eslint-plugin-svelte` and sets `svelte.kit.files.routes` to `src/routes`.
- `eslint-plugin-svelte` (which the migration initially kept as an Oxlint JS plugin) and the
  now-unused `globals` package were removed.
- `pnpm lint` = `vp fmt --check .` + `vp lint .` + `oxvelte lint src/`.

Oxvelte is a Rust binary, not an npm dependency. Install it once per machine:

```sh
cargo install --git https://github.com/tolgaouz/oxvelte.git --locked
```

### Type checking

Oxlint's `typeCheck` is disabled, while `typeAware` stays on. Turning `typeCheck` on makes
`vp lint` report every project-wide TypeScript error, and the project already has ~280
pre-existing `svelte-check` errors. Type checking remains `pnpm check` (svelte-check plus the
service-worker TS project) until that debt is paid down.

### Formatting

- Tailwind class sorting is intentionally not enabled in `fmt`. The old
  `prettier-plugin-tailwindcss` configuration was a no-op on this codebase; enabling Oxfmt's
  sorter would reorder classes in ~213 Svelte files for no functional gain.
- `src-tauri/` is excluded from `fmt`; `Cargo.toml` belongs to Cargo, and formatting it only
  changed line endings.
- `.prettierignore` was deleted; its entries already exist in `fmt.ignorePatterns`.

### Pre-commit hook

The default `vp staged` rule (`vp check --fix`) would fail on the repository's pre-existing
lint debt for most staged files. The hook now only formats (`vp fmt`). Run `pnpm lint` and
`pnpm check` before pushing until the lint and type debt is cleared.

## Vitest 5 review items

`vp migrate` reported two `project-inheritance` review items for the inline `client` and
`server` projects. Both already declare `extends: './vite.config.ts'`, which is equivalent to
Vitest 5's default root-config inheritance, so the effective configuration is unchanged and
no compatibility setting is needed.

The generated v4 compatibility settings (`clearMocks: false`, `sharedViteServer: false`) are
kept. Removing them requires running the full suite (database-backed tests and the Playwright
browser project), which cannot be validated in every environment yet.

## Verification

| Check                                                 | Result                                                                           |
| ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| `svelte-kit sync`                                     | pass                                                                             |
| `pnpm check:sw`                                       | pass                                                                             |
| `vp build` (adapter-auto)                             | pass with `DATABASE_URL`, `BETTER_AUTH_SECRET`, `ORIGIN` set                     |
| `vp fmt --check .`                                    | pass                                                                             |
| `vp test --run src/lib/vitest-examples/greet.spec.ts` | pass                                                                             |
| `pnpm lint`                                           | fails on pre-existing debt: 267 Oxlint errors/11 warnings and 122 Oxvelte errors |
| `pnpm check`                                          | fails on ~280 pre-existing `svelte-check` errors                                 |

The lint and type counts are unchanged in kind from the pre-migration ESLint/svelte-check
baseline; the dominant causes are `typescript/no-explicit-any`, `svelte/require-each-key` and
`svelte/no-navigation-without-resolve`.

## Follow-ups

- Pay down the Oxlint/Oxvelte lint debt, then re-enable `vp check --fix` in the `staged` hook.
- Fix the TypeScript errors, then enable Oxlint `typeCheck` and remove the duplicated type
  gate.
- Remove the Vitest v4 compatibility settings once the database and browser suites can run
  reliably.
- Optionally adopt Tailwind class sorting as a dedicated formatting commit.
