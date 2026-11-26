from pathlib import Path
import json,math
from datetime import datetime,timezone,timedelta
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph,Table,TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

ROOT=Path(__file__).resolve().parent.parent
W,H=A4;M=43;CW=W-2*M
TEAL=colors.HexColor('#0F766E');BLUE=colors.HexColor('#2563EB');INK=colors.HexColor('#0F172A');MUTED=colors.HexColor('#64748B');PALE=colors.HexColor('#F0FDFA');BORDER=colors.HexColor('#E2E8F0')
FONT='Helvetica';BOLD='Helvetica-Bold'
if Path('C:/Windows/Fonts/segoeui.ttf').exists():
 pdfmetrics.registerFont(TTFont('Segoe','C:/Windows/Fonts/segoeui.ttf'));pdfmetrics.registerFont(TTFont('SegoeBold','C:/Windows/Fonts/segoeuib.ttf'));FONT='Segoe';BOLD='SegoeBold'
pdfmetrics.registerFontFamily(FONT,normal=FONT,bold=BOLD)
BODY=ParagraphStyle('body',fontName=FONT,fontSize=10,leading=15,textColor=INK,spaceAfter=8)
SMALL=ParagraphStyle('small',parent=BODY,fontSize=8.5,leading=12)
LEAD=ParagraphStyle('lead',parent=BODY,fontSize=12,leading=18,textColor=MUTED)
TITLE=ParagraphStyle('title',parent=BODY,fontName=BOLD,fontSize=24,leading=30,textColor=TEAL)
repo='https://github.com/nitinsharma2005900-ai/MediCore-Hospital-Patient-Care-Management-Platform'
summary=json.loads((ROOT/'docs/evidence/final-test-summary.json').read_text(encoding='utf-8'))
assessments=json.loads((ROOT/'docs/evidence/assessment-status.json').read_text(encoding='utf-8'))
output=ROOT/'MediCore_Project_Documentation.pdf'
c=canvas.Canvas(str(output),pagesize=A4);c.setTitle('MediCore | Verified implementation and submission documentation');c.setAuthor('Nitin Sharma');c.setSubject('Synthetic hospital operations platform; implementation, evidence and deployment limits')
page_number=0;y=0
def paragraph(text,style=BODY,x=M,width=CW,top=None):
 global y
 p=Paragraph(text,style);_,height=p.wrap(width,H)
 pos=y if top is None else top
 if pos-height<49:raise RuntimeError(f'Page {page_number} content would overlap footer: {text[:45]}')
 p.drawOn(c,x,pos-height)
 if top is None:y=pos-height-9
 return height
def section(title):
 global y
 y-=7;paragraph('<b>'+escape(title)+'</b>',ParagraphStyle('section',parent=BODY,fontSize=12,leading=17,textColor=TEAL))
def new_page(title):
 global page_number,y
 if page_number:c.showPage()
 page_number+=1;c.setFillColor(TEAL);c.rect(0,H-8,W,8,fill=1,stroke=0)
 c.setFont(BOLD,9);c.drawString(M,H-31,'MediCore');c.setFont(FONT,8);c.setFillColor(MUTED);c.drawRightString(W-M,H-31,'Hospital, Appointment & Patient Care Management')
 c.setStrokeColor(BORDER);c.line(M,41,W-M,41);c.setFont(FONT,8);c.setFillColor(MUTED);c.drawString(M,26,'Nitin Sharma  |  Synthetic educational project');c.drawRightString(W-M,26,f'{page_number:02} / 12')
 y=H-65
 if title:paragraph(escape(title),TITLE);y-=9
def table(rows,widths=None,header=True,size=8.8):
 global y
 style=ParagraphStyle('cell',parent=SMALL,fontSize=size,leading=size+3)
 data=[[Paragraph(escape(str(v)),style) for v in row] for row in rows]
 t=Table(data,colWidths=widths or [CW/len(rows[0])]*len(rows[0]),hAlign='LEFT')
 rules=[('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LINEBELOW',(0,0),(-1,-1),.4,BORDER)]
 if header:rules.extend([('BACKGROUND',(0,0),(-1,0),PALE),('TEXTCOLOR',(0,0),(-1,0),TEAL)])
 t.setStyle(TableStyle(rules));_,height=t.wrap(CW,H)
 if y-height<49:raise RuntimeError(f'Table overflows page {page_number}: {height}')
 t.drawOn(c,M,y-height);y-=height+13
def arrow(x1,y1,x2,y2):
 c.line(x1,y1,x2,y2);angle=math.atan2(y2-y1,x2-x1);s=4
 p=c.beginPath();p.moveTo(x2,y2);p.lineTo(x2-s*math.cos(angle-.5),y2-s*math.sin(angle-.5));p.lineTo(x2-s*math.cos(angle+.5),y2-s*math.sin(angle+.5));p.close();c.drawPath(p,fill=1,stroke=0)
def diagram(nodes,edges,height,name):
 global y
 top=y;bottom=y-height
 def xy(n):return M+n[1]*CW,bottom+n[2]*height
 bw=CW*(.22 if len(nodes)>8 else .27);bh=38
 c.setStrokeColor(colors.HexColor('#94A3B8'));c.setFillColor(colors.HexColor('#94A3B8'));c.setLineWidth(.7)
 lines=[]
 for edge_index,(a,b) in enumerate(edges):
  ax,ay=xy(nodes[a]);bx,by=xy(nodes[b]);dx=bx-ax;dy=by-ay
  if abs(dy)<.01 and abs(dx)>bw*1.5:
   route_y=ay+bh/2+7+(edge_index%2)*6
   points=[(ax,ay+bh/2+2),(ax,route_y),(bx,route_y),(bx,by+bh/2+2)]
   for j in range(3):
    start,end=points[j],points[j+1]
    if j==2:arrow(*start,*end)
    else:c.line(*start,*end)
    lines.append((start[0]-M,height-(start[1]-bottom),end[0]-M,height-(end[1]-bottom)))
   continue
  d=max(abs(dx)/(bw/2+3),abs(dy)/(bh/2+3),1);sx=ax+dx/d;sy=ay+dy/d;ex=bx-dx/d;ey=by-dy/d
  arrow(sx,sy,ex,ey);lines.append((sx-M,height-(sy-bottom),ex-M,height-(ey-bottom)))
 for node in nodes:
  x0,y0=xy(node);c.setFillColor(colors.white);c.setStrokeColor(BORDER);c.roundRect(x0-bw/2,y0-bh/2,bw,bh,7,fill=1,stroke=1);c.setFillColor(TEAL);c.setFont(BOLD,9);c.drawCentredString(x0,y0-3,node[0])
 # Standalone vector artifact matching the PDF geometry.
 svg=[f'<svg xmlns="http://www.w3.org/2000/svg" width="900" height="{height*900/CW:.1f}" viewBox="0 0 {CW} {height}"><rect width="100%" height="100%" fill="#f8fafc"/>']
 for a,b,d,e in lines:svg.append(f'<line x1="{a}" y1="{b}" x2="{d}" y2="{e}" stroke="#94a3b8"/>')
 for node in nodes:
  x0,y0=xy(node);px=x0-M;py=height-(y0-bottom);svg.append(f'<rect x="{px-bw/2}" y="{py-bh/2}" width="{bw}" height="{bh}" rx="7" fill="white" stroke="#cbd5e1"/><text x="{px}" y="{py+3}" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" font-weight="bold" fill="#0f766e">{escape(node[0])}</text>')
 svg.append('</svg>');(ROOT/f'docs/architecture/{name}.svg').write_text(''.join(svg),encoding='utf-8')
 y=bottom-17
def screenshot(file,x,top,width,height,label):
 path=ROOT/'docs/screenshots'/file
 if not path.exists():raise RuntimeError('Missing genuine screenshot '+file)
 reader=ImageReader(str(path));iw,ih=reader.getSize();scale=min(width/iw,height/ih);dw,dh=iw*scale,ih*scale
 c.setFillColor(colors.white);c.setStrokeColor(BORDER);c.roundRect(x-3,top-height-3,width+6,height+6,4,fill=1,stroke=1)
 c.drawImage(reader,x+(width-dw)/2,top-dh,width=dw,height=dh,preserveAspectRatio=True,mask='auto')
 c.setFont(FONT,8);c.setFillColor(MUTED);c.drawString(x,top-height-16,label)

new_page('')
c.setFillColor(PALE);c.roundRect(M,H-281,CW,154,16,fill=1,stroke=0);c.setFillColor(TEAL);c.setFont(BOLD,48);c.drawString(M+25,H-204,'MediCore');c.setFillColor(BLUE);c.rect(M+26,H-228,52,5,fill=1,stroke=0)
y=H-325;paragraph('Hospital, Appointment &amp;<br/>Patient Care Management Platform',ParagraphStyle('cover',parent=TITLE,fontSize=25,leading=34))
paragraph('Implementation, audit, test evidence and submission documentation',LEAD);y-=18
table([['Developer','Nitin Sharma'],['Assessment level','Advanced / Very Difficult'],['Framework','15 mandatory assessments · 1,500 possible evaluation points'],['Evidence date',summary['recorded_at']],['Submission status','Verified local implementation; cloud deployment blocked by account access']],widths=[135,CW-135],header=False,size=10)
paragraph('Synthetic data only. No medical, legal or regulatory compliance claim. No evaluation score is assigned.',SMALL)

new_page('Executive summary')
paragraph('MediCore coordinates synthetic hospital operations from appointment scheduling through clinical encounters, laboratory review and billing. Patients and staff work in separate role experiences, while the backend decides which records each person may access.',LEAD)
section('Problem and objectives')
paragraph('The assessment focuses on two critical risks: overlapping provider appointments and unauthorized clinical-record access. The platform also needs clear workflows, consistent records, operational reporting, repeatable setup and defensible evidence.')
section('What the audit changed')
paragraph('The existing interface and service structure were preserved. The audit found that the API used arrays in memory even though its documentation claimed PostgreSQL verification. It also found incomplete session revocation, anonymous FHIR access, permissive CORS, an in-memory job queue and invented analytics fallbacks.')
paragraph('The runtime now uses PostgreSQL transactions and constraints, consent-aware record scope, active session checks and a Redis/BullMQ worker with a durable outbox. UI corrections include mobile navigation, accessible controls, functional care/billing tools and real dashboard data.')
section('Demonstrable result')
table([['Area','Verified behavior'],['Scheduling','Provider availability, time zones, collision rejection and controlled changes'],['Clinical privacy','Patient ownership, doctor/nurse assignment, consent and released lab values'],['Care and billing','Encounter → diagnosis/prescription → laboratory → invoice → simulated payment'],['Evidence','Automated suites, actual browser screenshots, incidents, backup/restore and CI']],widths=[100,CW-100])
paragraph('Render access is not connected. External SMTP/SMS delivery, peer approvals and live production verification remain explicitly unverified. These limits are reflected in the assessment table and detailed Markdown reports.',SMALL)

new_page('Technology and architecture')
table([['Layer','Actual implementation'],['Interface','Next.js App Router, React, TypeScript, Tailwind, TanStack Query, Framer Motion'],['Business API','Node.js / Express, REST, Zod validation, JWT sessions and scoped authorization'],['Analytics','Python 3 / FastAPI, Pydantic, pandas, NumPy, HTTPX and pytest'],['Data and jobs','PostgreSQL / pg query layer, SQL migrations, Redis and BullMQ'],['Delivery','Docker/Compose, GitHub Actions, OpenAPI and Postman; Render configuration prepared']],widths=[95,CW-95])
diagram([('Next.js UI',.18,.84),('Express API',.5,.84),('PostgreSQL',.82,.84),('FastAPI',.18,.23),('BullMQ worker',.5,.23),('Redis',.82,.23)],[(0,1),(1,2),(3,1),(4,2),(4,5)],190,'system-architecture')
paragraph('Express owns business data and rules. FastAPI requests an authorized operational projection rather than maintaining its own patient database. PostgreSQL is also the durable notification outbox; Redis schedules retryable jobs.',BODY)
section('Preservation trade-off')
paragraph('A transaction-scoped adapter retains the original array-based controllers inside an isolated unit of work. It serializes requests under a database advisory lock and persists normalized rows. This favors correctness and preservation for the demo; scoped SQL repositories and finer locks are the next scaling step.',SMALL)

new_page('Database design')
paragraph('The verified catalog contains 24 tables, including migration metadata, and 51 foreign-key constraints. Versioned SQL migrations are authoritative. A full catalog-derived ER diagram and schema dump accompany this document.',BODY)
nodes=[('User',.13,.85),('Department',.38,.85),('DoctorProfile',.63,.85),('PatientProfile',.88,.85),('Appointment',.13,.5),('Encounter',.38,.5),('Prescription',.63,.5),('LabOrder',.88,.5),('LabResult',.13,.15),('Invoice',.38,.15),('ConsentRecord',.63,.15),('AuditLog',.88,.15)]
diagram(nodes,[(0,2),(0,3),(1,2),(2,4),(3,4),(4,5),(5,6),(5,7),(7,8),(3,8),(3,9),(5,9),(3,10),(0,11)],220,'core-er-diagram')
paragraph('Core relationship overview. Doctor/patient profiles have a unique user link; each appointment has at most one encounter. Other depicted parent-child links are one-to-many. Items, payments, vitals, diagnoses, assignments and delivery metadata are expanded in the standalone ER diagram.',SMALL)
table([['Integrity concern','Database protection'],['Provider collision','GiST exclusion on doctor plus a half-open timestamptz range'],['Wrong patient association','Composite foreign keys across appointment, encounter, orders, results and invoices'],['Invalid or duplicate data','Unique identifiers, positive duration/quantity/amount checks and bound query values'],['Audit integrity','Append-only database trigger plus application mutation guards']],widths=[135,CW-135])
paragraph('A real pg_dump archive was restored into a new disposable database. Row counts and critical constraints matched. The application database was not overwritten.',SMALL)

new_page('Core modules and user roles')
paragraph('Permissions combine role, record ownership, active care assignment and patient consent. Hiding a button does not grant or revoke server access.',LEAD)
table([['Role','Main responsibilities','Permission boundary'],['Patient','Profile, appointments, own prescriptions/results, invoices, consent','Own records; final validated lab values only'],['Receptionist','Patient directory, booking, check-in and waiting list','Operational scheduling; no full clinical chart'],['Doctor','Assigned encounters, diagnoses, prescriptions, lab review and availability','Assigned patients/records and scoped consent'],['Nurse','Assigned care information and encounter vitals','Explicit active CareAssignment and consent'],['Lab technician','Assigned orders and measured result entry','Assigned lab order; patient association and consent'],['Billing officer','Invoice creation, calculation, simulated settlement and print','Billing scope; no clinical chart'],['Administrator','Staff, departments, operational analytics and audits','Does not receive unrestricted clinical access']],widths=[85,210,CW-295],size=9)
section('Demo isolation')
paragraph('Each role has a separate synthetic account. The intentionally public demo password does not grant infrastructure access. Do not load actual records or credentials into this environment. Separate browser sessions are useful when demonstrating role boundaries.')
section('Care modules')
paragraph('Provider schedules, appointments, waiting lists, encounters, vitals, clinician-entered diagnoses, prescriptions, laboratory orders/results, invoices/payments, consent records, notification delivery and audit events are connected through PostgreSQL relationships.')

new_page('Appointment and care workflow')
diagram([('Registration',.18,.86),('Availability',.5,.86),('Booking',.82,.86),('Check-in',.18,.53),('Encounter',.5,.53),('Prescription / lab',.82,.53),('Result review',.18,.2),('Invoice / payment',.5,.2),('Notify / audit',.82,.2)],[(0,1),(1,2),(2,3),(3,4),(4,5),(5,6),(6,7),(7,8)],255,'service-data-flow')
section('Collision prevention')
paragraph('The API validates a future provider slot in the correct IANA time zone. Booking and rescheduling run inside PostgreSQL transactions. An advisory lock prevents stale unit-of-work writes, and the independent GiST exclusion constraint rejects overlaps even when a different SQL client bypasses the API. Adjacent slots remain valid.')
section('Controlled care transitions')
paragraph('Reception checks in the patient before the assigned doctor starts an encounter. Parent/child patient associations are checked by the service and the database. Prescription and laboratory status changes are restricted. Preliminary lab values remain hidden from the patient until doctor validation.')
section('Consent and persistence')
paragraph('Patient consent applies to staff access and can be restricted to a role or user. Revocation blocks later historical clinical reads. All workflow records and active session/revocation state persist across new API instances and application restarts. Payments and outbound delivery remain synthetic simulations.',SMALL)

new_page('APIs and integrations')
table([['API group','Examples / behavior'],['Express REST','62 operations under /api/v1: auth, patients, providers, scheduling, care, labs, billing, consent, notifications and audits'],['Operational analytics','Five authenticated FastAPI metrics: utilization, waiting time, lab turnaround, population and departments'],['Dataset processing','Bounded CSV/JSON validation and a controlled performance benchmark'],['FHIR exchange','Authenticated local mock for Patient, Appointment, Encounter and final Observation resources'],['Email / SMS','Local database-backed delivery simulators; BullMQ retry and idempotency evidence'],['Documentation','Live Swagger UIs, OpenAPI 3.1 request schemas, Postman collection and permission reference']],widths=[112,CW-112],size=9.5)
section('API conventions')
paragraph('REST responses use a success/data or success/error envelope with safe error codes and request correlation IDs. Pagination is bounded. FHIR success responses use FHIR resource/bundle shapes. Missing/expired/revoked credentials return 401; record/role/consent denials return 403; scheduling conflicts return 409; dependency outages return 503.')
section('Actual local documentation')
paragraph('<link href="http://localhost:4010/api-docs/" color="#2563EB">Express Swagger — localhost:4010/api-docs/</link><br/><link href="http://localhost:8010/docs" color="#2563EB">FastAPI Swagger — localhost:8010/docs</link>',BODY)
paragraph('Analytics is calculated from authorized PostgreSQL projections. Empty measurements produce null/empty metrics; unavailable data does not become invented sample data. No generative AI API, real payment service or real patient communication is used.',SMALL)

new_page('Security and reliability')
for title,text in [
('Authentication and revocation','bcrypt hashes protect passwords. Access JWTs include a session identifier checked against PostgreSQL. Full refresh tokens are hashed; rotation consumes the old token, replay revokes the session family and logout invalidates access/refresh use.'),
('Least privilege and consent','Patient ownership, clinician assignment, nurse care assignment, lab assignment and scoped active consent are enforced by the API. Administrators do not inherit clinical chart access. Composite foreign keys independently protect record association.'),
('Web and input protection','Server schemas, parameterized SQL, exact CORS origins, secure headers, bounded request IDs, request/upload limits and login/refresh rate limits handle untrusted input. Logs omit payloads, queries and clinical free text.'),
('Durable jobs and incidents','PostgreSQL stores the outbox and delivery ledger. BullMQ retries with backoff and idempotent delivery IDs. Controlled tests prove failure, retry, Redis recovery and safe database-outage responses.'),
('Audit and backup','Clinical access/denials and important changes create audit rows; SQL rejects update/delete. A real isolated restore proves the captured backup. Cloud archival/retention and off-host production backups are not configured.')]:
 section(title);paragraph(text,SMALL)
paragraph('Production hardening remains necessary: scoped SQL repositories, shared rate limits, stronger browser session isolation, separate migration/runtime privileges and verified cloud controls. This synthetic project makes no compliance certification claim.',SMALL)

new_page('All 15 mandatory assessments')
status_short={'Completed and verified':'Verified locally / in CI','Partially completed':'Partial — see limitations','Blocked':'Blocked — Render access'}
table([['#','Assessment','Actual verification status']]+[[f'{a["number"]:02}',a['name'],status_short[a['status']]] for a in assessments],widths=[28,245,CW-273],size=8.3)
paragraph('“Verified” refers to the implemented scope and recorded cases, not exhaustive correctness or external production certification. Interoperability uses explicit local mocks/simulators. Git protection/peer review, live releases and cloud deployment remain partial or blocked. The detailed traceability file maps original PDF objectives, sources, APIs, tests and evidence.',SMALL)

new_page('Testing and incident simulations')
table([['Suite','Executed','Passed','Failed']]+[[s['name'].split('(')[0],s['executed'],s['passed'],s['failed']] for s in summary['suites']]+[['Total',summary['total'],summary['passed'],summary['failed']]],widths=[CW-156,56,50,50],size=8.3)
paragraph(f'Backend Jest line coverage: {summary["backend_coverage"]["lines"]["pct"]}%; statement coverage: {summary["backend_coverage"]["statements"]["pct"]}%. Frontend/Python coverage percentages were not measured. Builds, lint/types, npm audit, Docker builds and Compose health/isolation checks have actual evidence. Skipped checks: {summary["skipped"]}.',SMALL)
section('Five controlled local incidents')
for text in [
'Unauthorized access: cross-patient and administrator chart requests return 403 and are audited.',
'Appointment conflict: competing HTTP requests yield 201/409; SQL exclusion rejects direct overlap.',
'Delayed notification: three failed attempts are recorded; controlled retry and Redis recovery deliver once.',
'Database outage: /ready and business APIs return 503; restart recovers readiness and retained records.',
'Wrong lab association: API returns 400; the database independently rejects the patient mismatch.']:
 paragraph('• '+escape(text),SMALL)
paragraph('Important fixes: real persistence, timezone-safe ranges, refresh/logout revocation, FHIR scope, hidden preliminary values, actual analytics, Windows Tailwind output and mobile tab overflow. Raw logs and test outputs accompany the submission.',SMALL)

new_page('Actual application screenshots')
top=y;gap=18;tile=(CW-gap)/2
screenshot('patient-1440.png',M,top,tile,154,'Patient workspace — 1440 px')
screenshot('receptionist-1440.png',M+tile+gap,top,tile,154,'Appointment management — 1440 px')
screenshot('doctor-1440.png',M,top-185,tile,154,'Clinical care workflow — 1440 px')
screenshot('admin-1440.png',M+tile+gap,top-185,tile,154,'Operational analytics — 1440 px')
mobile_top=top-375;screenshot('patient-390.png',M,mobile_top,105,225,'Patient workspace — 390 px')
paragraph('These images were captured from the actual local application in Chromium. They are not generated mockups. Full-resolution PNG files for every role at 390 and 1440 pixels accompany the source.',SMALL,x=M+130,width=CW-130,top=mobile_top-10)
paragraph('Browser automation also verified 360, 768, 1024 and 1920 pixel dashboards, route protection, booking, landing pages and printable invoices. The production Render interface is not pictured because no cloud deployment was verified.',SMALL,x=M+130,width=CW-130,top=mobile_top-103)

new_page('Deployment and submission')
paragraph('<b>GitHub repository</b><br/><link href="'+repo+'" color="#2563EB">MediCore-Hospital-Patient-Care-Management-Platform</link>',BODY)
paragraph('<b>Render application / production API</b><br/>Blocked: Render account access is not connected. No verified live HTTPS URL, cloud backup or production workflow is claimed.',BODY)
section('Run again on Windows')
paragraph('Open the existing workspace, run setup-local.ps1, install npm/Python dependencies, build shared/backend/frontend and run start-local.ps1. Exact PowerShell commands, tool paths and secret setup are in README.md and DEPLOYMENT_GUIDE.md. Existing .env files must not be overwritten.',BODY)
table([['Local service','Verified address'],['Frontend','http://localhost:3010'],['Express / Swagger','http://localhost:4010/api/v1 · /api-docs/'],['FastAPI / Swagger','http://localhost:8010 · /docs'],['Dedicated stores','PostgreSQL 5546 · Redis 6386']],widths=[120,CW-120])
section('Delivery and remaining work')
paragraph('Docker Compose runs the complete six-service environment. GitHub Actions has real test/build/container evidence. The Render Blueprint is prepared with free-plan limitations documented; no paid service was purchased. Private-repository branch protection was rejected by the account plan, and no peer approval is claimed.',SMALL)
paragraph('The ZIP includes source, migrations, seed, tests, evidence, screenshots, diagrams, API collection, this 12-page PDF, the Loom script, technical review answers and known limitations. It excludes actual environment files, credentials, dependency folders, database data and build caches.',SMALL)
paragraph('MediCore is demonstrable locally with explicit evidence and transparent limits. Live deployment, external delivery adapters, cloud operations and peer review require the documented follow-up.',SMALL)

if page_number!=12:raise RuntimeError(f'Unexpected page count {page_number}')
c.save()
import fitz
doc=fitz.open(str(output));assert len(doc)==12
preview=ROOT/'.runtime/pdf-preview';preview.mkdir(parents=True,exist_ok=True)
for i,page in enumerate(doc):
 assert page.get_text().strip(),f'Blank page {i+1}'
 page.get_pixmap(matrix=fitz.Matrix(1.1,1.1),alpha=False).save(str(preview/f'page-{i+1:02}.png'))
from PIL import Image,ImageOps,ImageDraw
for group in range(2):
 sheet=Image.new('RGB',(960,1350),'#e2e8f0');draw=ImageDraw.Draw(sheet)
 for index in range(6):
  n=group*6+index+1;img=Image.open(preview/f'page-{n:02}.png');img.thumbnail((300,620));x=(index%3)*320+(320-img.width)//2;yy=(index//3)*675+24;sheet.paste(img,(x,yy));draw.text(((index%3)*320+12,(index//3)*675+8),f'Page {n}',fill='#0f172a')
 sheet.save(preview/f'contact-{group+1}.jpg',quality=92)
(ROOT/'docs/evidence/pdf-validation.json').write_text(json.dumps({'pages':len(doc),'size':'A4','all_pages_nonblank':True,'preview_pages':12,'visual_inspection':'pending','path':str(output)},indent=2),encoding='utf-8')
print('Generated exactly 12 A4 pages:',output)
