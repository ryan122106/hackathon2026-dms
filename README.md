# DMS NextGen AI — Updated Codex handoff (v2)

This updated package **supersedes the original service-draft-only package**.

## Contents
- `CODEX_START_HERE.md` — the new short starting prompt.
- `CODEX_PROJECT_SPEC.md` — full integrated global Copilot + dark/light mode specification and guardrails.
- `wireframes/01-login.png` ... `07-mobile-ai-wizard.png` — **the same seven original images, unchanged**. Use for layout, hierarchy, spacing and flow, not required colors.
- `wireframes-overview.png` — unchanged overview of original wireframes.
- `html/` — original static visual references; **not working code** and not authoritative for dark theme.
- `CHANGES_FROM_V1.md` — summary of revisions.

## Setup with Codex
1. Extract ZIP in the project folder.
2. Add the original ~33-minute DMS video separately (not included in this ZIP because of its large size).
3. Paste `CODEX_START_HERE.md` to Codex, and instruct it to read `CODEX_PROJECT_SPEC.md` plus visual PNGs.
4. Ask it to IMPLEMENT the app, run build checks and demonstrate the login → global Copilot → search actual demo data → prepare and edit service draft → confirm save → search new order flow.
5. Configure Meta key privately using `.env.local` under `MODEL_API_KEY` and NEVER include a real key in prompts, client code or version control.

## Product concept
- Premium responsive automotive DMS for service advisors.
- Dark mode **default**, full light-mode alternative.
- Demo login (not production authentication).
- **Global AI Copilot**, visible on all DMS pages, grounds answers in actual fictional prototype data.
- AI service-order drafting remains the showcase with edit/review/approval.
- Guardrails enforce read-only assistant operations, no invented prices/diagnoses/bookings and no autonomous purchases.
- AI-assisted SDLC benefits are explained in presentation; the product serves DMS staff, not developers.

## Honesty
**Implementation update (22 October 2026):** A working Next.js application now lives directly in this folder. Run `npm install` then `npm run dev` and open http://127.0.0.1:3000. Use `advisor@demo.local` / `demo123` or Continue as Demo Advisor. See [IMPLEMENTATION.md](IMPLEMENTATION.md) for setup, architecture, AI configuration, limitations and checks, and [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for the walkthrough. The original handoff documentation below is retained for reference.

The reference video is evidence of existing workflows and layout, not proof of specific backend architecture or that GCR lacks AI tools. This package is a prototype specification, not a working app. All fictional sample records are labelled and there is no production integration.
