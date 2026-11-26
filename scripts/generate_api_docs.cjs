const fs=require('fs');const path=require('path');
const root=path.resolve(__dirname,'..');const spec=JSON.parse(fs.readFileSync(path.join(root,'apps/backend/src/swagger/openapi.json'),'utf8'));
spec.servers=[{url:'/api/v1',description:'Current API host'},{url:'http://localhost:4010/api/v1',description:'Verified local API'}];
spec.info.description='Synthetic educational hospital operations API. PostgreSQL is authoritative. All clinical, billing, consent and FHIR endpoints enforce authentication and resource scope. Administrators have operational access and cannot read clinical charts. EMAIL/SMS and payments are local simulators.';
spec.security=[{BearerAuth:[]}];
const permission={auth:'Login/register/refresh are public. Me/logout require an active bearer session.',departments:'Public department directory.',doctors:'Public directory and slots. Availability changes require the owning doctor.',patients:'Self or assigned clinician with active consent for charts; operational staff get demographic listings only.',appointments:'Patient self, receptionist, assigned doctor or assigned nurse, according to action.',encounters:'Assigned doctor or assigned nurse with scoped consent; patient may read own encounters.',prescriptions:'Assigned doctor writes; patient self and assigned clinician read.',lab:'Assigned technician enters results; ordering doctor validates; patients see only released final values.',billing:'Patient self or billing officer/administrator for operational billing. Simulated payments only.',consent:'Patient self only.',audit:'Administrator only. Append-only audit history.',notifications:'Authenticated user owns the notification.',fhir:'Authenticated patient self or assigned clinician with consent. Local R4-shaped mock.',operations:'Administrator only; operational projections exclude clinical identifiers.'};
const entries=[];
const shared=require('../packages/shared/dist');const {z}=require('zod');
const bodySchemas={
 '/auth/login':'LoginSchema','/auth/register':'RegisterPatientSchema','/appointments':'CreateAppointmentSchema',
 '/appointments/{id}/reschedule':'RescheduleAppointmentSchema','/appointments/{id}/cancel':'CancelAppointmentSchema',
 '/encounters':'CreateEncounterSchema','/encounters/vitals':'RecordVitalsSchema','/encounters/diagnoses':'AddDiagnosisSchema',
 '/prescriptions':'CreatePrescriptionSchema','/lab/orders':'CreateLabOrderSchema','/lab/results':'EnterLabResultSchema',
 '/billing/invoices':'CreateInvoiceSchema','/billing/payments':'RecordPaymentSchema','/consent/patient/{patientId}':'UpdateConsentSchema'
};
const customSchemas={
 RefreshSessionSchema:z.object({refreshToken:z.string().min(1)}),
 WaitingEntrySchema:z.object({patientId:z.string().uuid().optional(),doctorId:z.string().uuid().optional(),departmentId:z.string().uuid(),preferredDate:z.string().date(),urgencyLevel:z.enum(['LOW','MEDIUM','HIGH']).default('MEDIUM'),notes:z.string().max(500).optional()}),
 WaitingStatusSchema:z.object({status:z.enum(['OFFERED','CONVERTED','CANCELLED'])}),
 AvailabilitySchema:z.object({dayOfWeek:z.number().int().min(0).max(6),startTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),endTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),slotDurationMinutes:z.number().int().min(10).max(120),timeZone:z.string(),isActive:z.boolean().default(true)}),
 ProfileContactSchema:z.object({address:z.string().min(5).max(500),emergencyContactName:z.string().min(2).max(100),emergencyContactPhone:z.string().min(7).max(30)}),
 EncounterCompleteSchema:z.object({clinicalNotes:z.string().max(20000).optional()}),
 PrescriptionTransitionSchema:z.object({status:z.enum(['FILLED','DISCONTINUED'])}),
 LabTransitionSchema:z.object({status:z.enum(['COLLECTED','IN_ANALYSIS','CANCELLED'])}),
 StaffCreateSchema:z.object({email:z.string().email(),password:z.string().min(12),firstName:z.string().min(1),lastName:z.string().min(1),role:z.enum(['RECEPTIONIST','DOCTOR','NURSE','LAB_TECHNICIAN','BILLING_OFFICER','ADMIN']),departmentId:z.string().optional(),specialization:z.string().optional(),licenseNumber:z.string().optional()}),
 StaffStatusSchema:z.object({isActive:z.boolean()}),
 DepartmentCreateSchema:z.object({code:z.string().min(2).max(12),name:z.string().min(2).max(100),description:z.string().max(500).optional()}),
 CareAssignmentSchema:z.object({patientId:z.string().uuid(),nurseUserId:z.string().uuid(),active:z.boolean().default(true)})
};
Object.assign(bodySchemas,{'/auth/refresh':'RefreshSessionSchema','/appointments/waiting-list':'WaitingEntrySchema','/appointments/waiting-list/{id}':'WaitingStatusSchema','/doctors/{id}/availability':'AvailabilitySchema','/patients/{id}':'ProfileContactSchema','/encounters/{id}/complete':'EncounterCompleteSchema','/prescriptions/{id}/status':'PrescriptionTransitionSchema','/lab/orders/{id}/status':'LabTransitionSchema','/operations/staff':'StaffCreateSchema','/operations/staff/{id}':'StaffStatusSchema','/operations/departments':'DepartmentCreateSchema','/operations/care-assignments':'CareAssignmentSchema'});
spec.openapi='3.1.0';
for(const name of new Set(Object.values(bodySchemas))){const schema=shared[name]||customSchemas[name];if(schema)spec.components.schemas[name]=z.toJSONSchema(schema,{io:'input',unrepresentable:'any'});}
for(const file of fs.readdirSync(path.join(root,'apps/backend/src/routes')).filter(f=>f.endsWith('.routes.ts'))){
 const area=file.replace('.routes.ts','');const prefix={appointment:'appointments',patient:'patients',prescription:'prescriptions',encounter:'encounters',doctor:'doctors',department:'departments',notification:'notifications',lab:'lab',billing:'billing',consent:'consent',auth:'auth',audit:'audit',fhir:'fhir',operations:'operations'}[area];
 if(!prefix)continue;const text=fs.readFileSync(path.join(root,'apps/backend/src/routes',file),'utf8');
 const regex=/router\.(get|post|put|patch|delete)\(\s*'([^']+)'/g;let match;
 while((match=regex.exec(text))){const endpoint='/'+prefix+(match[2]==='/'?'':match[2]).replace(/:([a-zA-Z]+)/g,'{$1}');const method=match[1];
  spec.paths[endpoint]??={};const existing=spec.paths[endpoint][method]||{};
  const parameters=[...endpoint.matchAll(/\{([^}]+)\}/g)].map(m=>({name:m[1],in:'path',required:true,schema:{type:'string'},description:'Opaque record identifier'}));
  if(method==='get'&&!endpoint.includes('{'))parameters.push({name:'page',in:'query',schema:{type:'integer',minimum:1,default:1}},{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:500,default:100}});
  spec.paths[endpoint][method]={...existing,tags:[prefix],summary:existing.summary||`${method.toUpperCase()} ${endpoint}`,description:(existing.description||'')+'\nPermission: '+permission[prefix],parameters:existing.parameters||parameters,
   security:prefix==='auth'&&['/auth/login','/auth/register','/auth/refresh'].includes(endpoint)||['departments','doctors'].includes(prefix)&&method==='get'?[]:[{BearerAuth:[]}],
   responses:{...existing.responses,'200':{description:'Success (creation endpoints may return 201)'},'400':{description:'Schema validation or association error'},'401':{description:'Missing, expired, revoked, or invalid session'},'403':{description:'Role, relationship or consent denied'},'404':{description:'Resource not found'},'409':{description:'Conflict, duplicate, or invalid workflow transition'},'503':{description:'Dependency unavailable; no partial clinical write committed'}}};
  entries.push({prefix,endpoint,method});
  if(bodySchemas[endpoint]&&method!=='get')spec.paths[endpoint][method].requestBody={required:true,content:{'application/json':{schema:{$ref:'#/components/schemas/'+bodySchemas[endpoint]}}}};
 }
}
// Remove undocumented legacy paths that no longer exist in the router inventory.
for(const endpoint of Object.keys(spec.paths))for(const method of Object.keys(spec.paths[endpoint]))if(!entries.some(e=>e.endpoint===endpoint&&e.method===method))delete spec.paths[endpoint][method];
for(const endpoint of Object.keys(spec.paths))if(!Object.keys(spec.paths[endpoint]).length)delete spec.paths[endpoint];
fs.writeFileSync(path.join(root,'apps/backend/src/swagger/openapi.json'),JSON.stringify(spec,null,2)+'\n');
const collection={info:{name:'MediCore verified hospital API',schema:'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',description:'Use synthetic data only. Log in first; accessToken is a session secret, do not export populated environment files.'},variable:[{key:'baseUrl',value:'http://localhost:4010/api/v1'},{key:'accessToken',value:''}],auth:{type:'bearer',bearer:[{key:'token',value:'{{accessToken}}',type:'string'}]},item:entries.map(e=>({name:e.method.toUpperCase()+' '+e.endpoint,request:{method:e.method.toUpperCase(),header:[{key:'Content-Type',value:'application/json'}],url:'{{baseUrl}}'+e.endpoint.replace(/\{([^}]+)\}/g,'{{$1}}'),description:permission[e.prefix],...(['post','patch','put'].includes(e.method)?{body:{mode:'raw',raw:e.endpoint==='/auth/login'?JSON.stringify({email:'patient@medicore.health',password:'Password123!'},null,2):'{}'}}:{})}}))};
function example(schema,key=''){
 if(schema.default!==undefined)return schema.default;if(schema.enum)return schema.enum[0];if(schema.const!==undefined)return schema.const;
 if(schema.anyOf)return example(schema.anyOf.find(s=>s.type!=='null')||schema.anyOf[0],key);
 if(schema.type==='object')return Object.fromEntries((schema.required||[]).map(k=>[k,example(schema.properties[k],k)]));
 if(schema.type==='array')return [example(schema.items,key)];if(schema.type==='boolean')return true;if(schema.type==='number'||schema.type==='integer')return Math.max(schema.minimum||1,1);
 if(/Id$/.test(key))return '{{'+key+'}}';if(key==='email')return 'patient@medicore.health';if(key==='password')return 'Password123!';
 if(schema.format==='date-time')return '{{'+key+'}}';if(schema.format==='date')return '2026-12-10';if(/phone/i.test(key))return '+1-555-0199';return 'Synthetic '+key+' fixture';
}
for(let i=0;i<entries.length;i++){const name=bodySchemas[entries[i].endpoint];if(name&&collection.item[i].request.body)collection.item[i].request.body.raw=JSON.stringify(example(spec.components.schemas[name]),null,2);}
fs.writeFileSync(path.join(root,'postman/MediCore_Postman_Collection.json'),JSON.stringify(collection,null,2)+'\n');
const rows=entries.map(e=>`| ${e.method.toUpperCase()} | \`${e.endpoint}\` | ${permission[e.prefix]} |`).join('\n');
fs.writeFileSync(path.join(root,'docs/API_REFERENCE.md'),'# API reference\n\nRuntime router inventory. Full request examples are in Swagger and the shared Zod schemas.\n\n| Method | Endpoint | Permission |\n|---|---|---|\n'+rows+'\n\nAll errors have `success:false`, an `error.code`, a safe `error.message`, and a request correlation ID. FHIR responses use a FHIR resource/bundle on success. FastAPI exposes `/analytics/appointment-utilization`, `/analytics/waiting-times`, `/analytics/lab-turnaround`, `/analytics/population-metrics`, `/analytics/department-statistics`; all require an administrator bearer token. Missing metrics are null; failed upstream calls return 503.\n');
console.log('Generated inventory for '+entries.length+' actual API operations');
