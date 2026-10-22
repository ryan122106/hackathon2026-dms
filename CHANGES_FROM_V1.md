# Changes from v1

- Expanded service-order-only AI to **DMS Copilot**, globally available on all workspace pages.
- Added grounded read-only intents for orders, customers, appointments and inventory, plus order summaries and navigation assistance.
- Kept safe AI draft creation with explicit human review and save.
- Introduced authoritative **dark-default + working light toggle**; all seven visual wireframes and static HTML references stay unchanged as requested.
- Added current-state consistency contract so Copilot answers reflect orders created in the UI.
- Added P0-lite Customers, Appointments, and Inventory views to make AI answers checkable.
- Added server-side bounded intents/tools and model-output validation; no arbitrary actions, SQL, hallucinated quantities, purchases or appointments.
- Updated six-hour timebox and judge demo to show both global queries and drafting.
- Removed requirement to build any developer-facing AI testing assistant; AI-supported SDLC demonstrated through team methodology in presentation.
