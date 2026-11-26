import json
import urllib.request
def call(url,body=None,token=None):
    headers={"Content-Type":"application/json"}
    if token: headers["Authorization"]="Bearer "+token
    request=urllib.request.Request(url,data=json.dumps(body).encode() if body else None,headers=headers)
    with urllib.request.urlopen(request,timeout=15) as response: return json.load(response)
session=call("http://127.0.0.1:4010/api/v1/auth/login",{"email":"admin@medicore.health","password":"Password123!"})
token=session["data"]["tokens"]["accessToken"]
for path in ["appointment-utilization","waiting-times","lab-turnaround","population-metrics","department-statistics"]:
    result=call("http://127.0.0.1:8010/analytics/"+path,token=token)
    assert result["status"]=="success"
    print("PASS authenticated operational analytics:",path)
