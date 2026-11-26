from pathlib import Path,PurePosixPath
import zipfile,json,hashlib,uuid,os
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parent.parent
NAME='MediCore_Final_Verified_Project.zip';target=ROOT/NAME
excluded={'.git','node_modules','.next','dist','build','.venv','venv','env','__pycache__','.pytest_cache','coverage','test-results','playwright-report','blob-report','.runtime','.tools','.cache','.idea','.vscode','backups'}
def files():
 for directory,dirs,names in os.walk(ROOT):
  dirs[:]=[d for d in dirs if d not in excluded]
  for name in names:
   path=Path(directory)/name;relative=path.relative_to(ROOT)
   if name.startswith('.env') and name!='.env.example':continue
   if name==NAME+'.sha256' or path.suffix.lower() in {'.zip','.pyc','.pyo','.tsbuildinfo','.exe','.dll','.dump','.sqlite','.sqlite3','.db','.key','.pem'}:continue
   if path.suffix=='.log' and relative.parts[:2]!=('docs','evidence'):continue
   yield path,relative.as_posix()
required=['README.md','ASSESSMENT_CHECKLIST.md','TEST_REPORT.md','DEPLOYMENT_GUIDE.md','SECURITY_REPORT.md','INCIDENT_REPORT.md','KNOWN_LIMITATIONS.md','LOOM_DEMO_SCRIPT.md','TECHNICAL_REVIEW_GUIDE.md','DEMO_ACCOUNTS.md','FINAL_DELIVERY_REPORT.md','.env.example','MediCore_Project_Documentation.pdf','apps/backend/src/database/postgres.ts','apps/backend/src/jobs/notifications.ts','apps/frontend/src/app/page.tsx','apps/analytics-service/main.py','database/schema.sql','docker-compose.yml','render.yaml','.github/workflows/ci.yml','postman/MediCore_Postman_Collection.json','docs/evidence/final-test-summary.json','docs/screenshots/patient-390.png','docs/architecture/system-architecture.svg']
assert len(PdfReader(str(ROOT/'MediCore_Project_Documentation.pdf')).pages)==12
report_path=ROOT/'docs/evidence/package-validation.json'
report={'archive':NAME,'status':'pending','required_files':len(required),'contains_actual_env':False,'contains_dependencies':False}
report_path.write_text(json.dumps(report,indent=2),encoding='utf-8')
def create():
 with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
  for path,relative in sorted(files(),key=lambda x:x[1]):archive.write(path,relative)
def verify(extract=False):
 with zipfile.ZipFile(target) as archive:
  assert archive.testzip() is None
  names=set(archive.namelist());assert all(name in names for name in required)
  assert not any(PurePosixPath(n).is_absolute() or '..' in PurePosixPath(n).parts for n in names)
  assert not any(any(part in excluded for part in PurePosixPath(n).parts) for n in names)
  assert not any(PurePosixPath(n).name.startswith('.env') and PurePosixPath(n).name!='.env.example' for n in names)
  if extract:
   destination=ROOT/'.runtime'/('package-extract-'+uuid.uuid4().hex)
   destination.mkdir(parents=True)
   archive.extractall(destination)
   for name in required:assert (destination/name).is_file()
   assert len(PdfReader(str(destination/'MediCore_Project_Documentation.pdf')).pages)==12
  return len(names)
create();count=verify(extract=True)
report.update(status='passed',files=count,crc_check='passed',real_extraction='passed',expected_files_present=True,documentation_pages=12)
report_path.write_text(json.dumps(report,indent=2),encoding='utf-8')
create();verify()
digest=hashlib.sha256(target.read_bytes()).hexdigest()
(ROOT/(NAME+'.sha256')).write_text(digest+'  '+NAME+'\n',encoding='ascii')
print(json.dumps({'archive':str(target),'files':count,'bytes':target.stat().st_size,'sha256':digest,'extraction':'passed'}))
