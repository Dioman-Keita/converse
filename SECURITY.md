# Security policy

## Supported versions

Converse is released from the `main` branch. Security fixes go into `main`. Self-hosters should update with
`git pull` followed by `./start.sh --build` (or `.\start.ps1 -Build`).

## Reporting a vulnerability

**Please don't open a public issue for security problems.**

Report them privately through GitHub's
[private vulnerability reporting](https://github.com/Dioman-Keita/converse/security/advisories/new)
(_Security → Report a vulnerability_ on the repository). Include:

- what an attacker can do, and under which conditions;
- steps to reproduce or a proof of concept;
- the affected version (commit) and setup (Docker, Quick Tunnel or named tunnel, browser or Android app).

You can expect an acknowledgment within a few days. Once the issue is confirmed, a fix is prepared, released on
`main` and published as a security advisory, crediting you unless you prefer to stay anonymous.

## Scope

In scope: the server (REST API, WebSocket, authentication and sessions, media handling), the web client, the
Android app, and the default Docker Compose setup.

Out of scope: vulnerabilities in Cloudflare, Docker or other third-party services themselves, and attacks that
require physical access to the host machine or control of its administrator account.
