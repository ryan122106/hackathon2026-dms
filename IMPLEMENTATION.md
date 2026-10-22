# DMS NextGen AI — running application

Implemented directly in the handoff folder with Next.js App Router, TypeScript, Tailwind CSS 4, Zod and locally bundled Inter. All original documentation, HTML references and seven wireframes are retained. No nested application folder or GCR integration is used.

## Run

Requires Node.js 20.9 or newer and npm. From this folder:

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3000. Click **Continue as Demo Advisor**, or use `advisor@demo.local` / `demo123`. Sign-out removes the session marker. This is a demo gate, not authentication or authorization.

```sh
npm run typecheck
npm test
npm run build
npm start
```

Production builds use Next.js's supported webpack builder because the Windows Turbopack production compiler failed while launching its CSS worker in this environment. Development uses Turbopack.

## Routes

| Route | Behavior |
| --- | --- |
| `/login` | Valid/invalid credentials, one-click demo entry |
| `/dashboard` | Computed KPIs, daily queue, recent orders, AI shortcuts |
| `/service-orders` | Search ID, customer, vehicle or plate; status filters |
| `/service-orders/new` | Customer/vehicle → complaint/draft → editable review and explicit save |
| `/service-orders/[id]` | Saved data, original note, advisor note, status progression, scoped Copilot |
| `/customers` | Fictional customer/vehicle directory; start-order links |
| `/appointments` | Today/upcoming/all filters, timezone-aware stored schedule |
| `/inventory` | Eight stock items, SKU/name search, low-stock filter |
| `/copilot` | Larger workspace using the same assistant component/endpoints |

Global **Ask Copilot** works on every workspace page. Keyboard support includes Escape, a drawer focus trap, Enter to send, Shift+Enter for newline, stop, retry and reset. Both themes cover pages, controls, review and chat. Theme persists under `dms-nextgen-theme`.

## Canonical fictional state

`components/demo-provider.tsx` owns the shared browser state. Seeds include five customers/vehicles, five orders, five appointments and eight parts. Changes persist under `dms-nextgen-state-v1`, with strict Zod validation and customer/vehicle relationship checks. Storage failure preserves the draft and reports an error. Other tabs receive validated storage events.

New orders use timestamp-plus-random IDs. Only the explicit review action saves; a synchronous lock prevents duplicate confirmation. The advisor can advance Open → In Progress → Ready → Completed. Copilot always receives the current snapshot after a change.

Dates use **Asia/Kuala_Lumpur**. Seed appointments use the current date when generated; saving the state preserves their exact dates. This is sample data, not live availability. Browser storage is not a shared database; clearing it removes demo changes. Session chat is retained as text. Historical answers are snapshots; new questions query current state.

## Optional Meta Model API

Copy `.env.example` to `.env.local`, privately set a working `MODEL_API_KEY`, and restart the server. Never use a public-prefixed key variable. `.env.local` is git-ignored. The server-only adapter uses Chat Completions, a 15-second timeout and strict JSON output validation.

Defaults `https://api.meta.ai/v1` and `muse-spark-1.3` were checked against Meta's [official quickstart](https://dev.meta.ai/docs/cookbook/quickstart-chat-completions). Actual key eligibility and credits remain account-specific. **No working key was provided, so an actual live response could not be verified.** Tests cover the configured branch with mocked responses, malformed output and network failure.

The model receives a question/context to classify into one bounded intent, not the data collections. Trusted code queries the validated snapshot and constructs the result cards, quantities, IDs and internal URLs. Browser-to-server read snapshots exclude plates, original notes and advisor notes. Draft extraction sends only the complaint and vehicle make/model to the model, with basic email, phone, number, plate and explicit-address redaction. Use fictional text only; these heuristics are not a production privacy guarantee.

### Honest fallback

Missing key, network failure, timeout, malformed output or unsafe draft output switches to labelled **GUIDED DEMO**. Examples cover low-stock parts, open/Honda orders, customer lookup, today's appointments, exact order summary and draft navigation. Unsupported prompts explain the limits.

Prepared draft templates cover A/C cooling, brake noise, engine noise and maintenance. The fallback is a narrow keyword template, not general language understanding. Unsupported notes return an honest error and retain input. All generated fields remain editable. Appointment preferences always remain **NOT BOOKED**.

## Trust boundaries

- Strict request types, input caps, streamed body-size caps, same-host origin checks and a process-local throttle (60 requests/minute/client). Throttling is not distributed or production abuse protection.
- Purchases, deletes, booking, secret disclosure, diagnosis and exact-price requests are refused or unsupported. No assistant write tools, SQL, arbitrary execution or model-generated URLs.
- Strict Zod output parsing; common diagnostic/financial claims and non-inspection task verbs are rejected. This is defense in depth, not a guarantee of perfect semantic AI safety.
- Only advisor confirmation saves. Chat never mutates state. Notes are untrusted escaped text. Vehicle mismatches are flagged without changing selection.

This single-browser snapshot architecture is unsuitable for real confidential customer records or production authorization. No purchasing, inventory editing, real booking, invoices or technician assignment is advertised.

## Reference review

All seven wireframes were inspected for arrangement and mobile stacking. `Downloads/DMS_System (1).mp4` was sampled approximately every four minutes, plus focused frames at 05:00 and 18:45. Visible order documents/items, customer follow-ups, stock and purchasing screens informed the implementation. Sampling does not verify all audio/video or unseen backend behavior. Samples are git-ignored under `.reference-frames/`; originals were not modified.

## Browser tests

With the app running and Google Chrome installed:

```sh
npm run test:e2e
```

Playwright uses the installed Chrome channel. Set `PLAYWRIGHT_BASE_URL` to test another local port. Failure traces are in `test-results/`; working-flow screenshots are in `artifacts/`. Tests cover login, persistence, grounded results, refusals, editable draft/save/reload/status consistency, API recovery and 390px mobile layout. See `DEMO_SCRIPT.md` for the presentation flow.
