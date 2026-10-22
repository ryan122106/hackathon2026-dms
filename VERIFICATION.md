# Verification — 22 October 2026

## Meta integration follow-up

### Conversational questions — current result

Latency/fallback follow-up: conversation now uses a single validated model response rather than two serial calls. **34/34** unit/API tests passed. Explicit tests simulate 401, 403, 402, 429, 503, timeout and malformed output for both Copilot and complaint drafting, verifying labelled demo fallback, one upstream attempt, no upstream-secret disclosure, preserved concerns and recovery to live mode on the next successful request. TypeScript passed.

The single-request live conversation walkthrough passed in **56.8 seconds** for the five-message scenario. Timing includes browser operations and provider latency, so it is an observed test duration rather than a guaranteed response-time benchmark. Production build passed after this change.

Removed the command-only failure mode that turned ordinary questions into the same blanket refusal. Copilot now supports conversational guidance with bounded history, additional inventory searches and computed workspace summaries. Educational questions about restricted features are allowed, while direct business actions remain unavailable. General responses are labelled separately from verified app record cards.

**33/33** API/unit tests passed, including history bounds, educational questions, direct-action refusals, source-grounded inventory, context-based record references and rejection of common fabricated-record/action/price output patterns. TypeScript passed. A real live-provider browser conversation passed in 1.7 minutes: greeting/capabilities → engine-intake questions → polite follow-up wording → actual oil-filter stock → booking explanation. Screenshot: `artifacts/live-copilot-conversation.png`.

### Gateway correction — current result

Copilot status-label correction: the initial header now says **READY TO CONNECT**, successful provider responses say **LIVE MODEL**, genuine fallback says **GUIDED DEMO** with a reason, and local refusals say **APP GUARDRAIL** without downgrading the last successful connection label. A fresh live Chrome walkthrough passed these transitions. Unit/API tests now pass **27/27**; TypeScript also passes.

The user's OpenCode screenshot showed a custom gateway and `muse-1.3-gcr`, rather than direct Meta. The existing credential successfully authenticated after matching that provider URL/model and server-side Bearer header. The user explicitly approved unencrypted HTTP for this fictional demo. Both real connectivity checks passed. An opt-in Chrome walkthrough also passed (17 seconds), verifying LIVE MODEL complaint drafting with both A/C and engine concerns, correct BRK-001 stock/minimum and refusal of purchase commands. Evidence: `artifacts/live-gateway-complaints.png`.

**26/26** unit/API tests and TypeScript passed after the custom-provider change. The earlier direct-Meta 401 and key-format inference below are historical; they do not invalidate the gateway credential. The current key works at the configured gateway. Full setup is in `META_AI_SETUP.md`.

The custom-provider production build also passed. The public client-asset scan passed with the configured credential absent from browser assets.

The complaint regression `aircond not working, engine spoil` now preserves both concerns, with unverified engine wording and inspection-only tasks. New tests cover live-model omissions, exact-source evidence, extra action fields, fake appointment claims, role injection, same-system concerns and credential-safe errors. The full updated browser suite passed **6/6**, including the mixed complaint review screen (`artifacts/mixed-complaints-review.png`).

Final follow-up checks: **25/25** unit/API tests passed, TypeScript passed and the production build passed. The configured-key scan of `.next/static` also passed: no configured Meta credential was found in public client assets. Both credential files were confirmed git-ignored.

The existing `.env.txt` configuration was copied to ignored `.env.local` without displaying the key. A real call to Meta returned **HTTP 401 Unauthorized (JSON)**. Successful live extraction remains unverified until the credential is replaced/activated. The app displays the authentication fallback reason. No live success is claimed.

The results below are the original baseline; see `META_AI_SETUP.md` for the updated architecture and setup command.

All checks below were run against the implemented application in this folder.

| Check | Result |
| --- | --- |
| `npm install` / final dependency audit | Installed successfully; 0 reported vulnerabilities |
| `npm run typecheck` | Passed |
| `npm test` | 15 API, data validation and guardrail tests passed |
| `npm run test:e2e` | 5 Chrome browser walkthroughs passed |
| `npm run build` | Passed; all pages and both AI routes generated |
| `npm run start -- --port 3001` | Built production server started successfully |
| `node --import tsx scripts/smoke.ts` | Production login page, grounded inventory API and safe draft API passed |

Browser coverage includes invalid/correct/demo login, sign-out, dark/light persistence, inventory parity, exact order summaries, missing customers, purchase/secret/booking/price refusals, customer/vehicle restrictions, mismatch and embedded-instruction flags, editable review, disabled save until approval, duplicate-save prevention, refresh persistence, status changes visible to Copilot, API interruption/retry, responsive navigation and no horizontal overflow at 390px.

Screenshots are in `artifacts/`: dark and light dashboards, light Copilot, light draft, reviewed saved order, mobile wizard and mobile Copilot. Browser-generated trace/report files are ignored by Git.

The final browser suite passed in 28.9 seconds. The initial run exposed a localhost/127.0.0.1 origin mismatch, fixed in the HTTP boundary, and an ambiguous customer-select label, fixed with an explicit accessible name. Tests were rerun after those fixes.

Windows Turbopack production compilation failed while launching its CSS worker. The build script now uses Next.js's supported webpack builder; the final production build and actual production HTTP smoke passed. Development still runs through `npm run dev`.

No real model key was available. Missing-key guided mode was exercised in the browser and production runtime. Configured-model behavior, malformed output and model network failure were verified with mocked fetch responses; this does not verify actual Meta account access or a real live response. Guided outputs remain visibly labelled.

The temporary production smoke server was stopped after checks. The development preview is left running at http://127.0.0.1:3000 for the requested handoff.
