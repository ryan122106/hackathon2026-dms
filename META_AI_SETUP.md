# Meta AI setup and complaint guardrails

The app uses your OpenAI-compatible GCR gateway in both **DMS Copilot** and **Customer complaint → Organize with AI**. Direct Meta remains an optional provider configuration.

## Current configuration

Your OpenCode screenshot identified the correct provider URL and model. The earlier 401 resulted from sending a gateway credential to the direct Meta endpoint; the earlier `LLM_` key-format advice applied only to direct Meta keys and was not applicable to your gateway. The existing key now authenticates successfully against your gateway. No key was displayed or committed.

`.env.local` now contains these server-only settings, with the actual existing key retained privately:

```dotenv
MODEL_API_KEY=YOUR_PRIVATE_KEY_HERE
MODEL_PROVIDER=custom
MODEL_API_BASE_URL=http://47.84.184.85:4000/v1
MODEL_API_ALLOWED_ORIGIN=http://47.84.184.85:4000
MODEL_ID=muse-1.3-gcr
MODEL_ALLOW_INSECURE_HTTP=true
```

The app constructs `Authorization: Bearer <MODEL_API_KEY>` on the server. Store only the raw key in the variable, without the `Bearer ` prefix. Custom-provider requests use the compatible `system` instruction role and `max_tokens` parameter. The gateway's underlying model/provider implementation is outside this prototype; successful gateway responses do not independently establish direct Meta access.

The user explicitly approved HTTP for this fictional demo. HTTP does not encrypt the credential or request text in transit; use an HTTPS gateway before using this beyond the approved demo. Both credential files remain git-ignored. Model/user input cannot change the pinned origin, and redirects are rejected.

Restart `npm run dev` after changing settings. `npm run check:meta` sends two small fictional requests and prints safe diagnostics only. Despite the legacy command name, it uses whichever provider is configured. In the wizard, enter `aircond not working, engine spoil` and click **Organize with AI**. Successful responses display **LIVE MODEL**, while failures explain guided fallback.

Verified with the configured gateway: real complaint extraction and Copilot intent classification both succeeded. An actual Chrome walkthrough also verified LIVE MODEL drafting, both reported concerns, inventory quantities and refusal of purchase actions.

For direct Meta instead, use the `.env.example` defaults, set `MODEL_PROVIDER=meta` and use a direct Meta-issued credential. See [Meta authentication](https://dev.meta.ai/docs/authentication). Gateway credentials and model aliases need not match direct Meta credentials and IDs.

## What changed

### Conversational Copilot

Copilot now supports normal questions, greetings and follow-ups, rather than only classifying a small set of search commands. Examples:

- `Hello, what can you help me with?`
- `What questions should I ask a customer who says engine spoil?`
- `How should I phrase that politely?` (continues the preceding question)
- `Why can’t you book appointments?` (an explanation, not a booking request)
- `Do we have oil filters?` (current inventory quantities)
- `What needs attention in the workshop?` (computed workspace summary)

The last six conversation messages, each capped at 1,200 characters, and up to five result IDs per message provide follow-up context. History is untrusted context and never substitutes for the current snapshot when querying records.

Record questions use validated intent selection and fixed application read functions. General questions use a separate bounded, text-only model response labelled **AI GENERAL GUIDANCE**. That task receives the app workflow guide and bounded history, not the business-record collections. It cannot generate links, executable content, record cards or business actions. Output checks reject common invented-record, price and action-confirmation patterns. These are defense-in-depth checks, not a guarantee of perfect semantic correctness.

### Response time and fallback

Copilot now makes **one model request per message**. The same JSON response contains either a read intent or the conversational answer; a second answer-generation call is no longer needed. Responses currently appear after the complete JSON arrives, rather than streaming token by token. Gateway latency, queueing and model generation can still affect waiting time.

The model request has a 20-second timeout. Missing credentials, rejected/expired credentials (401/403), credit/rate-limit failures (402/429), network/server failure, timeout and invalid output return to **GUIDED DEMO** automatically, with a visible safe explanation. Failover does not make a second model request. Record searches use current app data; complaint drafting uses the prepared deterministic extraction templates. Unsupported fallback complaints retain their input and show an honest error rather than an invented draft. General offline help is narrower than live conversation.

Each new message attempts the configured provider again, so temporary outages can recover on the next successful request. An expired or revoked credential still needs replacing locally; the app does not refresh provider credentials itself. Drafts, saved orders and review requirements are preserved through fallback.

Educational discussion of restricted actions is supported. Direct requests to execute purchases, bookings, deletes, price changes or policy overrides remain blocked, with a short explanation specific to the request. No new write capability was added. Offline help stays visibly labelled and does not pretend to be live conversation.

The live gateway walkthrough verified a greeting, an engine-intake question, a contextual wording follow-up, oil-filter stock lookup and an explanation of booking limitations. Evidence is in `artifacts/live-copilot-conversation.png`.

- Trusted base instructions are centralized in `lib/ai/prompts.ts`. They implement the project specification's read-only, no-diagnosis, no-pricing, no-booking and human-review rules.
- The model extracts exact source quotes and bounded concern categories. It cannot generate business actions or inspection task text. The server checks that every quote exists in the submitted note.
- The application supplies inspection steps from a fixed allowlist. Explicit A/C/engine and other recognized concerns are preserved even if the model omits a category. Separate concerns retain their customer wording.
- `engine spoil`, `enjin rosak`, engine starting concerns, battery, tyres and transmission are supported in guided extraction. Unknown leftover text raises an advisor-review flag rather than silently disappearing.
- The mixed complaint produces both an A/C concern and **Engine problem reported by customer (unverified)**, plus an engine inspection and a question about the actual symptoms. It never treats “engine spoil” as a confirmed diagnosis or an instruction to replace an engine.

## Jailbreak resistance and limits

No model or prompt can be guaranteed jailbreak-proof. The application limits the impact of unwanted model output through architecture:

- Credentials exist only in server-side request headers, not the model's messages or browser code.
- Network requests go only to the configured provider origin, pinned by server-side configuration; redirects are rejected. Custom HTTP requires explicit opt-in.
- Strict JSON schemas reject extra fields, arbitrary tools and invalid intent names.
- Copilot queries fixed read functions; cards/links come from application code, not the model.
- Complaint instructions are treated as untrusted text. Fake role tags and explicit command clauses are excluded from extraction; raw notes remain locally available for advisor review.
- Source validation rejects fabricated symptoms and appointment preferences. Inspection tasks are application controlled, not model generated.
- No chat action saves orders, books appointments, buys parts, changes prices or modifies inventory. The review checkbox and explicit save remain mandatory.
- Safe failure messages distinguish authentication, quota, configuration and validation problems without echoing upstream errors or secrets.

These controls are appropriate defense in depth for the fictional prototype. They are not production authorization, a privacy guarantee or a proof against every semantic injection. Continue adversarial testing when prompts, models or capabilities change.

## Checks

```sh
npm test
npm run typecheck
npm run test:e2e
npm run build
npm run check:meta
npx tsx scripts/check-client-secrets.ts
```

The client-secret scan checks built public assets against the local configured key without printing it. Live checks require a valid key; mock tests are explicitly separate from real API connectivity.
