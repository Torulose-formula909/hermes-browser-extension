# Hermes Browser Extension

Browser-native side panel for [Hermes Agent](https://hermes-agent.nousresearch.com/docs) — connect web context to your local or remote Hermes runtime.

> Created by **Jon Komet** (`@abundantbeing`). Community extension for Hermes Agent by Nous Research.

## What it is

Hermes Browser Extension is not a browser chatbot. It is a Chrome/Edge side panel for the real Hermes Agent runtime. It talks to your Hermes Gateway/API server — local by default, remote when you configure a reachable URL — so it can use the models, tools, skills, sessions, memory, and MCP servers already configured in Hermes.

This repo is specifically for the **extension**. A future standalone **Hermes Browser** may become a separate native macOS/Linux/Windows app built on the groundwork from this extension.

## Status

Public alpha. Load unpacked. Local or remote API server. Read-only browser context. **Not on the Chrome Web Store yet.**

## Features

- Chrome/Edge/Chromium MV3 side panel powered by the Side Panel API.
- Connects to a configurable local or remote Hermes API server. Default: `http://127.0.0.1:8642`.
- Auto-syncs the connected Hermes runtime's providers/models, profiles, skills, and sessions after Connect/Test/Save and on side-panel startup.
- Sends active page/browser context to a persisted Hermes session.
- Captures active tab title/URL, open tabs, selected text, readable page text, metadata, headings, forms, links, and buttons where available.
- Supports voice dictation through the local Hermes audio transcription API, with a visible extension voice tab fallback for Chromium side-panel microphone blocks.
- Wraps webpage text as untrusted browser context before sending it to Hermes.
- Streams Hermes responses and falls back to non-streaming chat when needed.
- Uses local extension storage for gateway mode, Gateway URL, and API key/browser token.
- No `debugger`, `nativeMessaging`, click/type/form-submit, cookies, history, bookmarks, downloads, or browser-control permissions in v0.1.

## Requirements

- Hermes Agent installed and working.
- Hermes Gateway/API server enabled locally or on a reachable remote machine.
- Node.js 20+.
- Chrome, Edge, Brave, Comet, or another Chromium browser with Side Panel API support (Chrome 114+ baseline).

## Quick start walkthrough

### 1. Clone and build

```bash
git clone https://github.com/abundantbeing/hermes-browser-extension.git
cd hermes-browser-extension
npm install
npm run build
```

The loadable extension is generated at:

```text
dist/
```

### 2. Load unpacked in Chrome/Edge

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the repo's `dist/` folder — not the repo root and not `extension/`.
5. Pin/click the Hermes extension icon to open the side panel.

After code updates, run `npm run build` again and click **Reload** on the Hermes Browser Extension card in the browser extensions page.

### 3. Enable the Hermes API server

Hermes API server settings are environment variables on the machine running Hermes. Local-only is the safest default:

```bash
# ~/.hermes/.env on the Hermes machine
API_SERVER_ENABLED=true
API_SERVER_HOST=127.0.0.1
API_SERVER_PORT=8642
API_SERVER_KEY=<strong-local-secret>
API_SERVER_CORS_ORIGINS=chrome-extension://<your-extension-id>
```

For a remote Hermes machine, bind the API server to a reachable trusted interface and keep CORS narrow:

```bash
# ~/.hermes/.env on the remote Hermes machine
API_SERVER_ENABLED=true
API_SERVER_HOST=0.0.0.0
API_SERVER_PORT=8642
API_SERVER_KEY=<strong-remote-secret>
API_SERVER_CORS_ORIGINS=chrome-extension://<your-extension-id>
```

Then restart/start the gateway on that machine:

```bash
hermes gateway run
```

Do **not** expose the Hermes API server naked to the public internet. Use Tailscale/VPN/reverse proxy + HTTPS, a strong `API_SERVER_KEY`, and a specific `API_SERVER_CORS_ORIGINS` value for the extension origin. The Hermes API server can access the real Hermes runtime and tools.

### 4. Verify the API server

```bash
HERMES_GATEWAY_URL=http://127.0.0.1:8642
HERMES_AUTH_HEADER='Authorization: Bearer <API_SERVER_KEY>'
curl "$HERMES_GATEWAY_URL/health"
curl -H "$HERMES_AUTH_HEADER" "$HERMES_GATEWAY_URL/v1/models"
```

### 5. Connect the extension

In the side panel first-run screen:

1. Click **Connect to Hermes** and approve locally if your Hermes Desktop/gateway supports the approval flow.
2. If approval is not available yet, click **Manual setup**.
3. Enter:
   - Gateway mode: **Local API server** or **Remote API server**.
   - Gateway URL: `http://127.0.0.1:8642`, `http://<tailscale-ip>:8642`, or your HTTPS reverse-proxy URL.
   - API key / browser token: your scoped browser token or `API_SERVER_KEY`.
   - Session ID: `hermes-browser-extension`
   - Session title: `Hermes Browser Extension`
4. Click **Test connection**. This probes `/health`, `/v1/models`, and session creation, then refreshes skills and profiles.
5. Click **Save settings**.
6. Open a normal `https://` page, then ask something like: `Summarize this page in one sentence.`

After connection, the side panel automatically loads from the connected Hermes gateway:

- `/v1/models` — all providers/models Hermes can enumerate, including provider-qualified IDs.
- `/api/sessions` — recent Hermes sessions grouped by source.
- `/v1/skills` — slash-command skill suggestions in the composer.
- `/v1/profiles` — profile picker when the gateway exposes profile metadata.
- `/v1/capabilities` — feature flags such as audio transcription and Browser upload support.

The DOM/context chip should show a non-zero page-context count on normal readable pages. Browser internal pages such as `chrome://extensions` are intentionally restricted.

## Install with Hermes / Computer Use

You can ask Hermes to help install it:

```text
Install Hermes Browser Extension from https://github.com/abundantbeing/hermes-browser-extension. Clone it, run npm install, run npm run build, then use computer use to open chrome://extensions, enable Developer mode, load the dist folder unpacked, and help me connect it to my local or remote Hermes Gateway API server. Do not reveal, print, screenshot, or commit my API key.
```

## Security model

Hermes Browser Extension is intentionally conservative in v0.1:

- Local API server by default; remote API server support requires an explicit URL, token, and CORS allowlist.
- Strong bearer/API key required for API access.
- Page content is wrapped as untrusted context before it reaches Hermes.
- Read-only browser context capture: no click, type, form-submit, checkout, download, or browser-control behavior.
- No `debugger`, `nativeMessaging`, `cookies`, `history`, `downloads`, or `bookmarks` permissions.
- Restricted pages include browser internals, extension pages, and obvious banking/crypto/password/payment/health/government-tax categories.

See [`SECURITY.md`](SECURITY.md) for details.

## Troubleshooting

### I loaded the extension but nothing works

Make sure you loaded `dist/`, not the repo root. The selected folder must contain `manifest.json` directly.

### The side panel says it cannot connect

Check that Hermes Gateway/API server is running and reachable from the browser:

```bash
curl http://127.0.0.1:8642/health
# or, for remote mode:
curl http://<trusted-remote-host>:8642/health
```

If `/v1/models` fails, check `API_SERVER_KEY`, the extension's stored API key/browser token, and `API_SERVER_CORS_ORIGINS`. For remote mode, the browser extension origin (`chrome-extension://<id>`) must be allowlisted on the Hermes machine.

### The DOM chip says `0 chars`

Open a normal `https://` page and refresh context. Browser internal pages (`chrome://`, `edge://`, extension pages, devtools, etc.) are restricted by design.

### Microphone says blocked or voice dictation does not start

Chromium side panels can suppress microphone permission prompts. Hermes Browser Extension handles this with a visible extension voice page:

1. Click the mic button in the side panel.
2. If the side panel cannot capture the mic, a **Hermes Voice Dictation** tab opens.
3. In that tab, click **Start dictation**. This click is the permission gesture Chromium expects.
4. Speak, then click **Stop + transcribe**.
5. The transcript is sent back to the side panel composer automatically.

If Chromium still says the mic is blocked, click **Open microphone settings** in the voice tab and set Microphone to **Allow** for `chrome-extension://<the Hermes extension id>/`, then return to the voice tab and try again.

### The first-run Connect flow is unavailable

Use **Manual setup** with your local/remote Gateway URL and API key. The native Desktop approval flow is still evolving during alpha.

## GitHub PR/Issue auto-review

This repo includes two Hermes review runners:

- `npm run review:watch` — local poller for open PRs/issues. This works now from a machine that can reach Hermes and is authenticated with `gh`.
- `npm run review:event` — GitHub-event runner for future GitHub Actions/webhook wiring. It expects `GITHUB_EVENT_NAME`, `GITHUB_EVENT_PATH`, and `GITHUB_REPOSITORY`.

The local poller checks open PRs and issues, computes a stable signature from PR head SHA or issue title/body, and only reviews changed targets. It upserts one bot comment per PR/issue with a stable marker. PR diffs and issue bodies are treated as untrusted input.

Local setup:

```bash
# Uses gh auth token, local API_SERVER_KEY from ~/.hermes/.env,
# and http://127.0.0.1:8642 by default.
npm run review:watch
```

Optional overrides:

```bash
HERMES_REVIEW_REPO=abundantbeing/hermes-browser-extension
HERMES_REVIEW_GATEWAY_URL=http://127.0.0.1:8642
HERMES_REVIEW_API_KEY=<api-server-key-or-scoped-token>
HERMES_REVIEW_MAX_TARGETS=3
HERMES_REVIEW_STATE_FILE=~/.hermes/hermes-browser-review-state.json
```

For a GitHub-hosted Actions runner later, `HERMES_REVIEW_GATEWAY_URL` must be reachable from GitHub. A runner cannot reach `http://127.0.0.1:8642` on your personal machine; use a remote Hermes API server behind Tailscale/VPN/HTTPS or a self-hosted GitHub runner on the same network. Pushing `.github/workflows/*` also requires a GitHub token with `workflow` scope.

Local dry-run:

```bash
npm run review:watch:dry-run
```

Event-runner dry-run against a saved GitHub payload:

```bash
GITHUB_EVENT_NAME=pull_request_target \
GITHUB_EVENT_PATH=./event.json \
GITHUB_REPOSITORY=abundantbeing/hermes-browser-extension \
GITHUB_TOKEN=<github-token> \
npm run review:event:dry-run
```

## Development

```bash
npm test
npm run check:js
npm run check:manifest
npm run verify
npm run build
npm run package
```

Project layout:

```text
extension/
  manifest.json       MV3 extension manifest
  background.js       side panel behavior
  content.js          page context collector
  sidepanel.html      side panel UI
  sidepanel.css       side panel styling
  sidepanel.js        Hermes API client + UI state
  voice-dictation.*  visible extension voice recorder fallback for blocked side-panel mic capture
  request-permissions.* visible extension mic-permission helper page
  sidepanel-preview.html static visual QA preview
  assets/             local Hermes fonts, icons, and imagery
  lib/common.mjs      shared prompt/context/security utilities
scripts/
  build.mjs           copies extension/ to dist/
  check-manifest.mjs  validates required manifest assets/permissions
  hermes-review-github-event.mjs PR/issue event runner for GitHub Actions/webhooks
  hermes-review-watch.mjs local PR/issue review poller
  package.mjs         creates artifacts/hermes-browser-extension.tar.gz
tests/
  common.test.mjs     utility behavior tests
```

## Roadmap

- Native connect/approval flow with Hermes Desktop.
- Better model/session picker parity with Hermes Desktop.
- Chrome Web Store packaging after public alpha feedback.
- Permissioned browser-control MCP bridge behind explicit confirmations.
- Screenshot/vision workflow.
- Operator workflows built on browser context.

## Relationship to Hermes Agent

[Hermes Agent](https://github.com/NousResearch/hermes-agent) is an open-source project by Nous Research. Hermes Browser Extension is a community extension by Jon Komet that connects to a local or remote Hermes API server. It is designed to live at the edge of the ecosystem without adding core tool-schema footprint.

Useful links:

- Hermes docs: <https://hermes-agent.nousresearch.com/docs>
- Hermes API server docs: <https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server>
- Hermes upstream repo: <https://github.com/NousResearch/hermes-agent>

## Author

Built by **Jon Komet** (`@abundantbeing`).

## License

MIT. See [`LICENSE`](LICENSE).
