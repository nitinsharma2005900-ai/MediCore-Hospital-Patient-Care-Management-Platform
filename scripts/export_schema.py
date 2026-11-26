from pathlib import Path
from urllib.parse import urlparse,unquote
import subprocess,os
root=Path(__file__).resolve().parent.parent
settings=dict(line.split('=',1) for line in (root/'.env').read_text(encoding='utf-8-sig').splitlines() if '=' in line and not line.startswith('#'))
url=urlparse(settings['DATABASE_URL'])
env={**os.environ,'PGPASSWORD':unquote(url.password),'PGHOST':url.hostname,'PGPORT':str(url.port or 5432),'PGUSER':url.username}
executable=Path(os.getenv('POSTGRES_BIN',r'C:\Users\amits\Documents\FinCore\.tools\pgsql\bin'))/'pg_dump.exe'
result=subprocess.run([str(executable),'--schema-only','--no-owner','--no-acl',url.path.lstrip('/')],env=env,capture_output=True,text=True,check=True)
(root/'database/schema.sql').write_text(result.stdout,encoding='utf-8')
print('Exported actual PostgreSQL schema (no data or credentials)')
