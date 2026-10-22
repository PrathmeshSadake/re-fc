# REA setup and method

REA is [Reverse Engineer Anything](https://github.com/morluto/rea), published as the npm package [`rea-agents`](https://www.npmjs.com/package/rea-agents). Guides and showcases used for this investigation:

- https://rea.tools/
- https://rea.tools/guides/ and https://rea.tools/guides/browser/
- https://rea.tools/guides/javascript/
- https://rea.tools/showcase/
- Repository docs: `docs/installation.md`, `docs/browser-observation.md`, `docs/browser-scenario-contract.md`, `docs/website-script-export.md`, `docs/mcp-contracts.md`, and `.agents/skills/reverse-engineer-anything/SKILL.md`

This session used **rea-agents 6.7.0** on Ubuntu 24.04, Node.js 22.23.4, and Google Chrome 156.0.8078.47. `ps` is procps-ng 4.0.4 at `/usr/bin/ps`, which satisfies the Linux owned-process prerequisite in `docs/installation.md`.

## What was run

Global `npm install -g` failed with `EACCES` on `/usr/lib/node_modules`. The package was installed for this user instead:

```bash
npm install --prefix "$HOME/.local" rea-agents@latest
export PATH="$HOME/.local/node_modules/.bin:$PATH"
rea --version   # 6.7.0
```

Setup was planned, then applied, for the only detected client:

```bash
rea setup --client cursor --dry-run --json
rea setup --client cursor --yes --json
```

The dry run status was `planned`. It proposed two actions and no Hopper install:

1. Create `/home/ubuntu/.cursor/mcp.json` with the REA MCP server (`rea mcp`).
2. Install the bundled skill at `/home/ubuntu/.agents/skills/reverse-engineer-anything`.

The applied run reported `status: ready` and `appliedActions: ["configured_cursor", "installed_skill"]`. Hopper, Ghidra, IDA, JADX, and Kuna were not installed. `rea doctor --json` still reports those native engines as missing. They are not required for website or JavaScript work.

This cloud agent session cannot hot-load a newly written MCP server, so the investigation used the CLI. The skill documents that path explicitly: the CLI returns the same Evidence records as MCP.

## Workflow that was followed

The browser guide says to start Chrome yourself with a debugging port and a dedicated profile, then let REA attach. Chrome was started with:

```bash
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/rea-flowcv-profile \
  --password-store=basic \
  --no-first-run \
  --no-sandbox \
  --disable-dev-shm-usage \
  https://flowcv.com/
```

`--password-store=basic` is the installation doc's workaround for a locked desktop keyring. `--no-sandbox` was required in this container.

Commands that returned Evidence:

| Command | What it did | Result |
| --- | --- | --- |
| `rea list-browser-targets` | Listed the FlowCV tab on `http://127.0.0.1:9222` | Worked. Evidence `ev_70d401ef317fc836374b76e9101243e350e7b6c8c3f431b74fde4b8fab38d0ab`. |
| `rea inspect-web-page` | DOM, accessibility, scripts, storage key names on `https://flowcv.com/` | Worked. Attribute *values* are not included. Storage on the marketing origin was empty. |
| `rea analyze-web-bundle` | Static parse of scripts on the marketing page | Worked for four small scripts. Evidence `ev_4654d27dcf8b906edc7fc512fee14faac8679fac53bc97218eda86c0929fbf0d`. |
| `rea analyze-web-bundle` | Same command on `https://app.flowcv.com/resumes` | Failed. Node heap OOM, exit 134, empty output. See `docs/evidence/rea-analyze-web-bundle-oom.txt`. |
| `rea capture-browser-scenario` | Launch or connect mode, declared clicks, accessibility, screenshots, network metadata and selected bodies | Worked for the home page, template picker, editor open, and download gate. |
| `rea capture-web-screenshot` | Viewport PNG of the marketing page | Worked. |
| `rea discover-webmcp-tools` | WebMCP tools on the template picker. The marketing-page bundle analysis had already reported none | Worked. Zero tools. Evidence `ev_493fae58511e97403397d8fd88cbd4db3f3245017078278ae298d94bc9f4795a`. |
| `rea inspect-web-page` (app) | Accessibility text, storage fingerprints, console text, script URLs on `/resumes` | Worked. Evidence `ev_d7dcc5f1fb9fc17e32fe6af1d29766199d12bec7ec35a192df7068e15b6b027e`. |
| `rea inspect-web-event-listeners` | First `button` on `/resumes` | Worked. One click listener in the vendor chunk, no source map. Evidence `ev_9df481b1a020a43f5c575af80c7da1d55191033446956ad03efa6279ea85926f`. |
| `rea analyze-javascript-application` | Local directory containing only `index-76c0f4b1.js`, heap cap 2048 MiB | Worked, coverage `partial`. Evidence `ev_73c6595685fe16e1898e36d38331b622f71c2be4bf176962eaf9530115598b60`. Endpoint inventory: `docs/evidence/rea-endpoint-inventory.txt`. |
| `rea trace-application-feature` | Same Evidence, seeds for `/api/resumes/download` | Worked as a tracer. The `api` seed matched nothing. The exact `string` seed matched once and the both-direction walk covered the whole retained graph. Evidence `ev_c4192883…` and `ev_62175790…`. |
| `rea capture-browser-scenario` | Guest tour of login, signup, pricing, cover letters, job tracker, settings | Worked. Evidence `ev_795c3363d9a3b993c2d439694e5fe58b73ebf59f4e271f579b27708778bbeeb5` and headed follow-up `ev_6cd2fe909c1edf62fb8b579f18f4b4a01af5cad17caa46e1e96069e7a9034558`. |
| `export-web-scripts` | Bridge a capture into the local analyzer | Not used for the app bundles. Scenario body budgets truncate multi-megabyte scripts, so the analyzer was pointed at the files already downloaded from the script URLs the captures named. |

Scenario actions are a closed set: `goto`, `click`, `fill`, `press`, `select_option`, `check`, `uncheck`, `wait_for`, `wait_for_timeout`. There is no drag action and no `evaluate`. Passive tools do not run page JavaScript. Storage capture returns key names and SHA-256 fingerprints, not values.

## Fallback tooling

Where REA could not answer a question, the same Chrome binary was driven with Playwright (the `playwright-core` copy already installed by `rea-agents`, plus `/usr/local/bin/google-chrome`):

- Read the guest `localStorage["flowcv-state"]` JSON shape. REA only stores a hash of that value.
- Fill personal details, add Experience and Education, and read `#resumePages` geometry.
- Read `data-rbd-draggable-id` / `data-rbd-droppable-id` on the section-order control.
- Confirm that typing does not call `/api/resumes/*` while logged out.

Those runs are labeled as Playwright in `flowcv-architecture.md`. They used the normal site as a user would. No auth bypass, no private API, no credential stuffing. Signup was not completed: the download dialog asks for Google or email, and the bundle shows a Cloudflare Turnstile widget on that path. A throwaway account would not have been a normal unattended signup.

Public responses were also fetched with `curl` when REA body budgets would have been spent on multi-megabyte images and scripts: `GET /api/auth/init_user` (then repeated inside an REA scenario so the body is Evidence) and `GET /pubcache/published-resume-templates`.

## What REA did well

- Target discovery, accessibility trees, and screenshots of the marketing site, template picker, editor shell, and signup gate.
- Network metadata with initiator-free Playwright events: hosts, methods, status, resource type, and header *names*.
- Response bodies for small JSON (`init_user`) and the signup-gate observation that **no** `/api/resumes/download` request was made.
- Static module edges on the Astro marketing page (`PageLayoutParent` imports `trackEvent`).
- A partial application graph of the 2.6 MB app chunk: endpoint mechanisms, route patterns, and the `ab_test_overrides` storage name.
- A clear Evidence envelope: `evidence_id`, `confidence: observed` or `derived`, limitations, and redaction of cookie and storage values.

## What REA did not do here

- `analyze-web-bundle` on the live app origin ran out of memory. The app chunk was analyzed afterward as a local file, with partial graph coverage and a semantic-node cap. The vendor chunk was not included in that analysis.
- Reveal `localStorage` values. That is by design. Storage capture returns names and SHA-256 fingerprints.
- Drag a section. The scenario schema has no drag action. A Playwright mouse drag on the `data-rbd-*` rows did not change `sectionOrder`.
- Produce a PDF file. Guests are stopped by the account dialog before the download request.
- Bind an `api`-kind feature seed to `/api/resumes/download` even though the string is an endpoint label in the same graph. The miss is recorded as coverage `no-match`, which the tool says is not absence.
- Export scenario script bytes into `export-web-scripts`. Response-body limits are below the size of `index-76c0f4b1.js` and `vendor-3446ddb3.js`.
