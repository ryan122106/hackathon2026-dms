# CODEX START HERE — DMS NEXTGEN AI (VERSION 2)

Build a working **Next.js App Router + TypeScript + Tailwind CSS** prototype called **DMS NextGen AI** using `CODEX_PROJECT_SPEC.md` as the **single functional source of truth**. Read the spec fully; inspect `wireframes/*.png` (unchanged original layout references); inspect the separately provided ~33-minute DMS video as reference for modules and workflows only.

**UPDATED PRODUCT DECISION:** This is no longer a service-draft-only AI. Build a **GLOBAL DMS COPILOT** accessible from all workspace pages. It safely searches and summarizes the app's CURRENT fictional service orders, customers, appointments, and parts inventory, and it helps create an **editable service-order draft**. It performs **no autonomous write actions**. Advisor manually reviews and confirms saving any service order. All results must agree with visible app data; no invented records.

**UPDATED DESIGN DECISION:** The existing wireframes are layout references only. Implement **premium dark mode as default** with a working light-mode toggle that persists across reload. All components, including the AI panel and review modal, must support both themes. **Do not regenerate the wireframe PNGs.**

Retain one-click demo login with fictional advisor, dashboard, orders, customers, appointments, inventory, AI wizard and order details. There is **no real authentication or real GCR integration**. All records are fake and labelled as such. We do not need developer-facing AI test tooling: we discuss AI-assisted SDLC in the presentation instead.

Use safe server-side Meta Model API integration when a working key is configured. No public keys. Validate AI intent and output; keep tool access allowlisted/read-only; refuse purchases, deletes, bookings, arbitrary SQL, diagnoses, pricing hallucinations. When live API unavailable, use **clearly labelled guided demo** examples rather than pretending AI is live.

**Build immediately**, working end-to-end first. Run build/type checks and test user flows after milestones. Only ask questions if truly blocking. Prioritize completion over unnecessary extra modules.
