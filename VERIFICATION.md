# Verification — 22 October 2026

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
