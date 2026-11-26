# Contributing to Converse

Thanks for your interest! Bug reports, ideas, documentation fixes and pull requests are all welcome.

## Contents

1. [Ground rules](#ground-rules)
2. [Development setup](#development-setup)
3. [Scripts](#scripts)
4. [Tests](#tests)
5. [Code layout and conventions](#code-layout-and-conventions)
6. [Pull requests](#pull-requests)
7. [Android app](#android-app)

## Ground rules

- **Search the existing issues first.** For a bug, include steps to reproduce, what you expected and what
  happened, plus your OS, browser and whether you run Docker or `npm run dev`.
- **Discuss large changes in an issue before writing code** (new features, schema changes, new dependencies).
- **Never report security issues in public.** Follow [SECURITY.md](SECURITY.md).
- Be kind and constructive in issues and reviews.

## Development setup

Requirements: **Node.js 24** (see `.nvmrc`), **Docker** for Postgres, and optionally **ffmpeg** for voice notes
and videos (the Docker image includes it).

```bash
npm install
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db
```

Set `DATABASE_URL` in `.env` to point at `localhost:5432` with your `DB_PASSWORD` (see `.env.example`), then:

```bash
npm run dev
```

The dev server runs on http://localhost:3000 with hot reload. If the `app` container already uses that port,
stop it (`docker compose stop app`) or run `npm run dev -- --port 3001`. Migrations are applied when the server starts.

## Scripts

| Script                             | Purpose                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| `npm run dev`                      | Dev server (Vite + Nitro, hot reload)                                             |
| `npm run build`                    | Production build into `.output/`                                                  |
| `npm run lint`                     | ESLint                                                                            |
| `npm run format` / `npm run check` | Prettier (write / check)                                                          |
| `npm run test`                     | Unit tests (Vitest, `src/**/*.test.ts`)                                           |
| `npm run test:e2e`                 | Server integration tests (REST + WebSocket) against the build and a real Postgres |
| `npm run generate-routes`          | Regenerates `src/routeTree.gen.ts`                                                |
| `npm run db:generate`              | Creates a migration after editing `server/db/schema.ts`                           |
| `npm run db:studio`                | Drizzle Studio database browser                                                   |

## Tests

Unit tests live next to the code (`*.test.ts`) and run with `npm run test`.

Integration tests (`tests/e2e/`) start the built server on port 3123 and run against a **dedicated** Postgres
database. They create accounts and rooms there, so never point them at a real database.

```bash
docker run -d --name converse-e2e-db -p 127.0.0.1:55432:5432 -e POSTGRES_USER=converse -e POSTGRES_PASSWORD=converse -e POSTGRES_DB=converse_test postgres:17
```

```bash
npm run build
```

```bash
npm run test:e2e
```

Optional variables: `E2E_DATABASE_URL` (default `postgres://converse:converse@127.0.0.1:55432/converse_test`),
`E2E_PORT` (default `3123`) and `E2E_SERVER_LOG=1` to print the server logs. Rebuild after changing `server/`.
Voice and video tests are skipped when ffmpeg isn't installed; CI installs it.

[CI](.github/workflows/ci.yml) runs on every pull request and every push. It runs the type check, ESLint, unit
tests, the build, and the integration tests against a `postgres:17` service.

## Code layout and conventions

```
server/          # Nitro backend
  api/           # REST → /api/*
  routes/ws.ts   # WebSocket → /ws
  db/            # Drizzle schema, client, migrations
  plugins/       # startup tasks (migrations, public URL logging)
  utils/         # auth, realtime hub, rooms, messages, media
src/             # web client, Feature-Sliced Design
  app/ pages/ widgets/ features/ entities/ shared/
  routes/        # TanStack routes (thin, delegate to pages)
mobile/          # Android app (React Native / Expo)
tests/e2e/       # server integration tests
docs/            # self-hosting guide, design system
```

- **TypeScript everywhere**, strict mode. Keep `tsc --noEmit` and `npm run lint` clean.
- **Feature-Sliced Design** in `src/`: a layer only imports from layers below it
  (`app → pages → widgets → features → entities → shared`).
- **User-facing text** goes through `src/shared/i18n/dictionaries.ts`, in **both English and French**.
  Server error messages follow the request's `Accept-Language` (see [ARCHITECTURE.md](ARCHITECTURE.md)).
- **UI changes** follow the [design system](docs/design/design-system.md): tokens only, Geist type, motion tokens.
  Run its checklist before opening the PR.
- **Database changes** go through a Drizzle migration (`npm run db:generate`), never by hand, and must keep
  existing data intact.
- **Documentation** is written in English. Update the README, the self-hosting guide or `ARCHITECTURE.md` in the
  same PR when behavior changes.

## Pull requests

1. Fork the repository and create a branch from `main` (`feat/…`, `fix/…`, `docs/…`).
2. Keep each PR focused on one change. Add or update tests when you change behavior.
3. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages and PR titles, with an
   optional scope: `feat(web): …`, `fix(server): …`, `docs(readme): …`.
4. Make sure CI passes. In the description, say what changed, why, and how you tested it (screenshots for UI changes).

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).

## Android app

The app in `mobile/` is a React Native (Expo) shell: an address screen, then a WebView showing the server's web app.
`npx expo prebuild` generates the native Android project at build time; it isn't committed.

### Build locally

Only Docker is needed. Node, the Android SDK and Gradle are cached in Docker volumes, and the APK lands in
`mobile/dist/`:

```bash
docker run --rm -v "$PWD/mobile:/project" -v converse-android-sdk:/sdk -v converse-android-gradle:/root/.gradle -v converse-node:/opt/node -v converse-npm:/root/.npm -e VERSION_NAME=0.1.0 eclipse-temurin:17-jdk bash /project/scripts/build-apk-in-docker.sh
```

The APK is signed with a debug key unless `ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`,
`ANDROID_KEY_ALIAS` and `ANDROID_KEY_PASSWORD` point to a release key. The build needs a few GB of disk and memory.

### Release (maintainers)

Push a tag such as `android-v0.2.0`. The [Android workflow](.github/workflows/mobile.yml) builds a signed APK and
attaches it to a GitHub release. Installed apps update in place because every release is signed with the same key,
stored in the repository secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` and
`ANDROID_KEY_PASSWORD`. If that key is lost, users must uninstall the app before installing a newer version.
