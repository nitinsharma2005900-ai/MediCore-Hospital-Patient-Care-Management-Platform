from pathlib import Path
import subprocess,re,json
root=Path(__file__).resolve().parent.parent
paths=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard'],cwd=root,text=True).splitlines()
settings={}
if (root/'.env').exists():
 settings=dict(line.split('=',1) for line in (root/'.env').read_text(encoding='utf-8-sig').splitlines() if '=' in line and not line.startswith('#'))
secrets=[v.strip('"') for k,v in settings.items() if re.search('SECRET|PASSWORD|TOKEN|KEY',k) and len(v.strip('"'))>=16]
findings=[];scanned=0
for name in sorted(set(paths)):
 p=root/name
 if not p.is_file():continue
 if p.name.startswith('.env') and p.name!='.env.example':findings.append({'file':name,'reason':'Actual environment file tracked'})
 raw=p.read_bytes();scanned+=1
 if any(s.encode() in raw for s in secrets):findings.append({'file':name,'reason':'Local secret value present'})
 if any(re.search(pattern,raw) for pattern in [rb'gh[oprsu]_[A-Za-z0-9]{30,}',rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',rb'AKIA[0-9A-Z]{16}']):findings.append({'file':name,'reason':'Credential pattern'})
report={'scanned_files':scanned,'findings':findings,'status':'passed' if not findings else 'failed','secrets_printed':False}
(root/'docs/evidence/secret-scan.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report))
raise SystemExit(bool(findings))
