# API reference

Runtime router inventory. Full request examples are in Swagger and the shared Zod schemas.

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/appointments` | Patient self, receptionist, assigned doctor or assigned nurse, according to action. |
| GET | `/appointments/waiting-list` | Patient self, receptionist, assigned doctor or assigned nurse, according to action. |
| POST | `/appointments/waiting-list` | Patient self, receptionist, assigned doctor or assigned nurse, according to action. |
| PATCH | `/appointments/waiting-list/{id}` | Patient self, receptionist, assigned doctor or assigned nurse, according to action. |
| GET | `/appointments/{id}` | Patient self, receptionist, assigned doctor or assigned nurse, according to action. |
| POST | `/appointments` | Patient self, receptionist, assigned doctor or assigned nurse, according to action. |
| PATCH | `/appointments/{id}/check-in` | Patient self, receptionist, assigned doctor or assigned nurse, according to action. |
| PATCH | `/appointments/{id}/reschedule` | Patient self, receptionist, assigned doctor or assigned nurse, according to action. |
| PATCH | `/appointments/{id}/cancel` | Patient self, receptionist, assigned doctor or assigned nurse, according to action. |
| GET | `/audit` | Administrator only. Append-only audit history. |
| POST | `/auth/login` | Login/register/refresh are public. Me/logout require an active bearer session. |
| POST | `/auth/register` | Login/register/refresh are public. Me/logout require an active bearer session. |
| POST | `/auth/refresh` | Login/register/refresh are public. Me/logout require an active bearer session. |
| POST | `/auth/logout` | Login/register/refresh are public. Me/logout require an active bearer session. |
| GET | `/auth/me` | Login/register/refresh are public. Me/logout require an active bearer session. |
| GET | `/billing/invoices` | Patient self or billing officer/administrator for operational billing. Simulated payments only. |
| GET | `/billing/invoices/{id}` | Patient self or billing officer/administrator for operational billing. Simulated payments only. |
| GET | `/billing/analytics` | Patient self or billing officer/administrator for operational billing. Simulated payments only. |
| POST | `/billing/invoices` | Patient self or billing officer/administrator for operational billing. Simulated payments only. |
| POST | `/billing/payments` | Patient self or billing officer/administrator for operational billing. Simulated payments only. |
| GET | `/consent/patient/{patientId}` | Patient self only. |
| POST | `/consent/patient/{patientId}` | Patient self only. |
| GET | `/departments` | Public department directory. |
| GET | `/departments/{id}` | Public department directory. |
| GET | `/doctors` | Public directory and slots. Availability changes require the owning doctor. |
| GET | `/doctors/{id}` | Public directory and slots. Availability changes require the owning doctor. |
| GET | `/doctors/{id}/available-slots` | Public directory and slots. Availability changes require the owning doctor. |
| PUT | `/doctors/{id}/availability` | Public directory and slots. Availability changes require the owning doctor. |
| POST | `/encounters` | Assigned doctor or assigned nurse with scoped consent; patient may read own encounters. |
| GET | `/encounters/{id}` | Assigned doctor or assigned nurse with scoped consent; patient may read own encounters. |
| PATCH | `/encounters/{id}/complete` | Assigned doctor or assigned nurse with scoped consent; patient may read own encounters. |
| POST | `/encounters/vitals` | Assigned doctor or assigned nurse with scoped consent; patient may read own encounters. |
| POST | `/encounters/diagnoses` | Assigned doctor or assigned nurse with scoped consent; patient may read own encounters. |
| GET | `/fhir/Patient` | Authenticated patient self or assigned clinician with consent. Local R4-shaped mock. |
| GET | `/fhir/Patient/{id}` | Authenticated patient self or assigned clinician with consent. Local R4-shaped mock. |
| GET | `/fhir/Appointment` | Authenticated patient self or assigned clinician with consent. Local R4-shaped mock. |
| GET | `/fhir/Appointment/{id}` | Authenticated patient self or assigned clinician with consent. Local R4-shaped mock. |
| GET | `/fhir/Encounter` | Authenticated patient self or assigned clinician with consent. Local R4-shaped mock. |
| GET | `/fhir/Encounter/{id}` | Authenticated patient self or assigned clinician with consent. Local R4-shaped mock. |
| GET | `/fhir/Observation` | Authenticated patient self or assigned clinician with consent. Local R4-shaped mock. |
| GET | `/fhir/Observation/{id}` | Authenticated patient self or assigned clinician with consent. Local R4-shaped mock. |
| GET | `/lab/orders` | Assigned technician enters results; ordering doctor validates; patients see only released final values. |
| GET | `/lab/orders/{id}` | Assigned technician enters results; ordering doctor validates; patients see only released final values. |
| POST | `/lab/orders` | Assigned technician enters results; ordering doctor validates; patients see only released final values. |
| POST | `/lab/results` | Assigned technician enters results; ordering doctor validates; patients see only released final values. |
| PATCH | `/lab/results/{id}/validate` | Assigned technician enters results; ordering doctor validates; patients see only released final values. |
| PATCH | `/lab/orders/{id}/status` | Assigned technician enters results; ordering doctor validates; patients see only released final values. |
| GET | `/notifications` | Authenticated user owns the notification. |
| PATCH | `/notifications/{id}/read` | Authenticated user owns the notification. |
| GET | `/operations/analytics-source` | Administrator only; operational projections exclude clinical identifiers. |
| GET | `/operations/staff` | Administrator only; operational projections exclude clinical identifiers. |
| PATCH | `/operations/staff/{id}` | Administrator only; operational projections exclude clinical identifiers. |
| POST | `/operations/staff` | Administrator only; operational projections exclude clinical identifiers. |
| POST | `/operations/departments` | Administrator only; operational projections exclude clinical identifiers. |
| POST | `/operations/care-assignments` | Administrator only; operational projections exclude clinical identifiers. |
| GET | `/patients` | Self or assigned clinician with active consent for charts; operational staff get demographic listings only. |
| GET | `/patients/{id}` | Self or assigned clinician with active consent for charts; operational staff get demographic listings only. |
| PATCH | `/patients/{id}` | Self or assigned clinician with active consent for charts; operational staff get demographic listings only. |
| GET | `/prescriptions` | Assigned doctor writes; patient self and assigned clinician read. |
| GET | `/prescriptions/{id}` | Assigned doctor writes; patient self and assigned clinician read. |
| POST | `/prescriptions` | Assigned doctor writes; patient self and assigned clinician read. |
| PATCH | `/prescriptions/{id}/status` | Assigned doctor writes; patient self and assigned clinician read. |

All errors have `success:false`, an `error.code`, a safe `error.message`, and a request correlation ID. FHIR responses use a FHIR resource/bundle on success. FastAPI exposes `/analytics/appointment-utilization`, `/analytics/waiting-times`, `/analytics/lab-turnaround`, `/analytics/population-metrics`, `/analytics/department-statistics`; all require an administrator bearer token. Missing metrics are null; failed upstream calls return 503.
