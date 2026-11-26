"""Create a real pg_dump archive and restore only into a new, disposable database.
No application database is overwritten. Credentials pass through environment variables.
"""
from pathlib import Path
from urllib.parse import urlparse, unquote
import subprocess, os, json, hashlib, uuid, argparse
root=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument('--postgres-bin',default=r'C:\Users\amits\Documents\FinCore\.tools\pgsql\bin')
args=parser.parse_args()
settings=dict(line.split('=',1) for line in (root/'.env').read_text(encoding='utf-8-sig').splitlines() if '=' in line and not line.startswith('#'))
url=urlparse(settings['DATABASE_URL']); database=url.path.lstrip('/'); name='medicore_restore_'+uuid.uuid4().hex[:10]
env={**os.environ,'PGPASSWORD':unquote(url.password),'PGHOST':url.hostname,'PGPORT':str(url.port or 5432),'PGUSER':url.username}
archive=root/'.runtime'/'medicore-verified.dump'
def run(exe,*options):
    result=subprocess.run([str(Path(args.postgres_bin)/exe),*options],env=env,capture_output=True,text=True)
    if result.returncode: raise RuntimeError(exe+' failed (inspect private runtime logs)')
    return result.stdout.strip()
try:
    run('pg_dump.exe','-Fc','--no-owner','--no-acl','-f',str(archive),database)
    digest=hashlib.sha256(archive.read_bytes()).hexdigest()
    run('createdb.exe',name)
    run('pg_restore.exe','--exit-on-error','--no-owner','--no-acl','-d',name,str(archive))
    counts={}
    for table in ['User','PatientProfile','Appointment','Encounter','LabResult','Invoice','AuditLog']:
        query=f'SELECT count(*) FROM "{table}"'
        original=run('psql.exe','-d',database,'-Atc',query)
        restored=run('psql.exe','-d',name,'-Atc',query)
        assert original==restored,table+' count differs'
        counts[table]=int(restored)
    constraint=run('psql.exe','-d',name,'-Atc',"SELECT count(*) FROM pg_constraint WHERE conname IN ('appointment_no_overlap','lab_result_patient')")
    assert constraint=='2'
    (root/'docs/evidence/backup-restore.json').write_text(json.dumps({'status':'passed','method':'pg_dump custom archive / pg_restore into a new disposable database','sha256':digest,'bytes':archive.stat().st_size,'verified_counts':counts,'constraints_verified':2,'application_database_overwritten':False},indent=2),encoding='utf-8')
    print('PASS real PostgreSQL backup, isolated restore, row counts and critical constraints')
finally:
    # This database name is newly generated above and cannot name the user's application database.
    run('dropdb.exe','--if-exists',name)
