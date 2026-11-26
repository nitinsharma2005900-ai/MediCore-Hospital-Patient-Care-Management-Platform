# MediCore demonstration script — 7 minutes 30 seconds

**0:00–0:35 — Introduction.** “Hello, I am Nitin Sharma. This is MediCore, a hospital appointment and patient care platform. All records are synthetic. Payments and outbound messages are simulations.”

**0:35–1:00 — Overview.** Show the landing page. Explain the seven roles, the appointment-to-care journey and why clinical privacy and scheduling conflicts matter.

**1:00–1:25 — Documentation.** Open the 12-page PDF, assessment checklist and actual test report. State which assessments are partial or blocked. Do not quote an evaluation score.

**1:25–2:10 — Application.** Open http://localhost:3010. Log in as the patient. Show actual appointments, released lab values, billing and consent. Book a future available slot. Explain the UTC timestamp and the provider's IANA time zone.

**2:10–3:35 — Care workflow.** Use the receptionist to check in the booked synthetic patient. The assigned doctor starts an encounter, records a clinician-entered diagnosis, prescription and lab order. An assigned technician enters a result. The doctor reviews and releases it. Billing creates an invoice; the patient makes a simulated payment. Show notification and audit history.

**3:35–4:20 — Roles and privacy.** Show nurse assignments and vitals, the lab workstation, billing and administrator analytics. Explain that administrators cannot open clinical charts. Demonstrate a denied cross-patient request and patient consent revocation. Do not display tokens or `.env`.

**4:20–5:10 — Backend/code.** Open routes, scope middleware and the PostgreSQL adapter. Explain server validation, token revocation, transactions and the independent exclusion constraint. A memory-only mutex would not protect multiple processes.

**5:10–5:45 — Python and database.** Open FastAPI Swagger. Explain operational metrics from authenticated database projections, no hardcoded fallback data and 503 on dependency failure. Show the ER diagram and composite patient associations.

**5:45–6:15 — GitHub.** Show https://github.com/nitinsharma2005900-ai/MediCore-Hospital-Patient-Care-Management-Platform, real commits, feature branch/pull request and actual Actions results. Branch protection was unavailable for the private repository on this account; no peer approval is claimed.

**6:15–6:50 — Deployment.** Open https://medicore-nitinsharma.onrender.com in a fresh session, show API readiness and analytics health, and explain the three free services, private datastore addresses and embedded worker. State the database's 26 December 2026 (00:30 IST) expiry, idle cold starts and missing managed backups. Show actual deployment evidence without revealing environment values.

**6:50–7:30 — Conclusion.** Show the real test counts and five controlled incident reports. Mention the local FHIR/mock delivery scope, scaling limits and remaining cloud/review work. Offer to trace a browser action through Express to PostgreSQL or make a small change during review.

Preparation: rehearse with separate browser sessions for each role and one fresh future appointment. Keep the test evidence visible. Never demonstrate real records, a real payment or fabricated deployment evidence.
