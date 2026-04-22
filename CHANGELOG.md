# Changelog

All notable changes to this project will be documented in this file.

## 1.1.0 - 2026-04-22

Changes on `origin/master` since `v1.0.0` (2026-04-09).

### Merged Pull Requests

- #1054: build(deps-dev): bump lerna from 8.2.4 to 9.0.4
- #1074: build(deps-dev): bump typescript from 5.9.3 to 6.0.2
- #1075: build(deps-dev): bump jest from 30.2.0 to 30.3.0
- #1076: build(deps-dev): bump pg from 8.19.0 to 8.20.0
- #1078: build(deps-dev): bump @types/node from 25.3.1 to 25.5.2
- #1079: build(deps-dev): bump mongodb from 7.0.0 to 7.1.1
- #1080: build(deps-dev): bump prettier from 3.8.1 to 3.8.2
- #1081: build(deps): bump follow-redirects from 1.15.6 to 1.16.0
- #1082: build(deps-dev): bump fastify from 5.8.3 to 5.8.5
- #1085: fix: replace direct uuid usage with node crypto
- #1086: [codex] Drop p-settle from spence-pg-repos
- #1088: [codex] migrate workspace to pnpm
- #1090: chore: migrate eslint to flat config
- #1091: build(deps-dev): bump mongodb from 7.1.1 to 7.2.0
- #1092: build(deps-dev): bump @eslint/js from 9.26.0 to 10.0.1
- #1093: build(deps-dev): bump eslint from 9.26.0 to 10.2.1
- #1094: [codex] fix jest project configs for jest 30
- #1096: [codex] Replace forked knex with explicit deferred results & upgrade package
- #1097: [codex] clarify peer integration CI coverage

## 1.0.0 - 2026-04-09

Changes on `origin/master` since `v0.10.2` (2023-12-23).

### Breaking Changes

- Node.js 22 is now required across the monorepo. Node 20 and older are no longer supported.
- `fastify` is no longer installed as a direct dependency of `@spencejs/spence`; consumers must provide their own compatible Fastify version.
- Fastify integration packages now declare Fastify as a peer dependency with support for Fastify 4 or 5, which may require consumer dependency updates.
- `@spencejs/spence-mongo-repos` now expects MongoDB as a peer dependency with support for MongoDB 6 or 7.
- `@spencejs/spence-pg-repos` now expects `pg` and `knex` as peer dependencies instead of bundling them as runtime dependencies.
- `spence-api` update routes now fail configuration unless both `updateSchema` and `replySchema` are provided.

### Changed

- Require Node.js 22 or newer across the monorepo and add a root `.nvmrc`.
- Migrate CI from CircleCI to GitHub Actions with a peer-dependency matrix for supported integrations.
- Move key integrations to peer dependencies where appropriate, including Fastify, MongoDB, `pg`, and `knex`.
- Expand compatibility to Fastify 4 and 5, MongoDB 6 and 7, and `pg` 8.

### Fixed

- Align `spence-api` REST validation and tests with Fastify v5 behavior.
- Tighten `findMany` query schemas so `limit` and `offset` are typed as non-negative integers.
- Fail `update` route registration unless both `updateSchema` and `replySchema` are provided.
- Forward controller extension boot errors through `next` instead of throwing synchronously.
- Clarify the current `PATCH` update semantics in the `spence-api` README.

### Dependencies

- Refresh runtime and toolchain dependencies across workspaces, including Fastify 5.8.3, `fastify-plugin` 5.1.0, `pg` 8.19.0, `pg-types` 4.1.0, MongoDB 7, Pino 10, UUID 11, Jest 30, TypeScript 5.9, and Prettier 3.8.
- Update supporting packages such as Lodash, Handlebars, Axios, `env-var`, `http-errors`, and related type definitions.
