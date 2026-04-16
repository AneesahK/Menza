# @demo/db

Database package using [Drizzle ORM](https://orm.drizzle.team/) with PostgreSQL.

Contains all schema definitions, widget type definitions (Zod), the database
client factory, ID generation utilities, and the seed script.

## Scripts

| Script | Command | Description |
| --- | --- | --- |
| `db:generate` | `dotenvx run ... drizzle-kit generate` | Generate SQL migrations from schema changes. **You must `pnpm build` this package first** — Drizzle config points to compiled `./dist/schema/index.js`. |
| `db:migrate` | `dotenvx run ... drizzle-kit migrate` | Apply pending migrations to the database. |
| `db:seed` | `dotenvx run ... tsx src/seed.ts` | Seed the database with a demo user, org, and org membership. |
| `db:studio` | `dotenvx run ... drizzle-kit studio --port=3002` | Open [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview) UI on port 3002 to browse/edit data. |
| `build` | `tsc -b tsconfig.build.json` | Compile TypeScript to `dist/`. |
| `typecheck` | `tsc -b tsconfig.json` | Type-check without emitting. |
| `lint` | `biome lint .` | Lint with Biome. |
| `watch` | `tsc --watch` | Watch mode for development. |

Run from the monorepo root using filter, e.g.:

```sh
pnpm --filter=@demo/db db:generate
```

## Migration workflow

1. Edit schema files in `src/schema/`
2. Build the package: `pnpm --filter=@demo/db build`
3. Generate migration: `pnpm --filter=@demo/db db:generate`
4. Review the generated SQL in `drizzle/`
5. Apply: `pnpm --filter=@demo/db db:migrate`

## Exports

| Import path | What it provides |
| --- | --- |
| `@demo/db` | `createDbClient()`, `DbClient`, `DatabaseTransaction` types |
| `@demo/db/schema` | All Drizzle table definitions and relation objects |
| `@demo/db/utils` | `createID()`, `id`, `timestamps`, `ulidCol`, `customIdSchema` |
| `@demo/db/types/widget/core` | `ItemConfig`, `CoreItem`, `itemConfigSchema`, etc. |
| `@demo/db/types/widget/ag` | AG Charts config schema |
| `@demo/db/types/widget/table-config` | Table widget config schema |
| `@demo/db/types/widget/metric-config` | Metric widget config schema |
| `@demo/db/types/widget/common` | Shared item types/statuses |
| `@demo/db/types/message` | `ToolCall`, `ThinkingContentBlock`, `Attachment` types |

## Relevant docs

- [Drizzle ORM docs](https://orm.drizzle.team/docs/overview)
- [Drizzle Kit (migrations)](https://orm.drizzle.team/docs/kit-overview)
- [Drizzle + PostgreSQL](https://orm.drizzle.team/docs/get-started/postgresql-new)
- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview)
- [Zod](https://zod.dev/)
