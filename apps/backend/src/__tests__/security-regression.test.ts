import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app';
import { seedDatabase } from '../database/seed';
import { store } from '../database/store';
import { config } from '../config';
const app=createApp();
const login=(email:string)=>request(app).post('/api/v1/auth/login').send({email,password:'Password123!'});
describe('Security regression boundaries',()=>{
  beforeEach(async()=>{await seedDatabase();});
  it('blocks unauthenticated FHIR exports',async()=>{expect((await request(app).get('/api/v1/fhir/Patient')).status).toBe(401);});
  it('scopes FHIR collections to the patient',async()=>{
    const l=await login('patient@medicore.health');
    const r=await request(app).get('/api/v1/fhir/Patient').auth(l.body.data.tokens.accessToken,{type:'bearer'});
    expect(r.status).toBe(200);expect(r.body.total).toBe(1);expect(r.body.entry[0].resource.id).toBe(l.body.data.user.patientProfileId);
  });
  it('rejects cross-patient FHIR identifiers',async()=>{
    const l=await login('patient@medicore.health');
    const other=store.patients.find(p=>p.id!==l.body.data.user.patientProfileId)!;
    expect((await request(app).get(`/api/v1/fhir/Patient/${other.id}`).auth(l.body.data.tokens.accessToken,{type:'bearer'})).status).toBe(403);
  });
  it('revokes both access and refresh credentials on logout',async()=>{
    const l=await login('patient@medicore.health');const t=l.body.data.tokens;
    expect((await request(app).post('/api/v1/auth/logout').auth(t.accessToken,{type:'bearer'})).status).toBe(200);
    expect((await request(app).get('/api/v1/auth/me').auth(t.accessToken,{type:'bearer'})).status).toBe(401);
    expect((await request(app).post('/api/v1/auth/refresh').send({refreshToken:t.refreshToken})).status).toBe(401);
  });
  it('rotates refresh tokens and revokes the family after replay',async()=>{
    const l=await login('patient@medicore.health'); const old=l.body.data.tokens;
    const rotation=await request(app).post('/api/v1/auth/refresh').send({refreshToken:old.refreshToken});
    expect(rotation.status).toBe(200); expect(rotation.body.data.refreshToken).not.toBe(old.refreshToken);
    expect((await request(app).post('/api/v1/auth/refresh').send({refreshToken:old.refreshToken})).status).toBe(401);
    expect((await request(app).get('/api/v1/auth/me').auth(rotation.body.data.accessToken,{type:'bearer'})).status).toBe(401);
  });
  it.each(['admin','receptionist','billing','labtech'])('denies %s full patient charts',async(role)=>{
    const l=await login(`${role}@medicore.health`);
    expect((await request(app).get(`/api/v1/patients/${store.patients[0].id}`).auth(l.body.data.tokens.accessToken,{type:'bearer'})).status).toBe(403);
  });
  it('does not permit a doctor to change patient consent',async()=>{
    const l=await login('doctor@medicore.health');
    expect((await request(app).post(`/api/v1/consent/patient/${store.patients[0].id}`).auth(l.body.data.tokens.accessToken,{type:'bearer'}).send({consentType:'CLINICAL_DATA_SHARING',granted:true})).status).toBe(403);
  });
  it('enforces consent revocation on historical clinical reads',async()=>{
    const p=store.patients[0];const l=await login('doctor@medicore.health');const token=l.body.data.tokens.accessToken;
    expect((await request(app).get(`/api/v1/patients/${p.id}`).auth(token,{type:'bearer'})).status).toBe(200);
    store.consents.filter(c=>c.patientId===p.id&&c.consentType==='CLINICAL_DATA_SHARING').forEach(c=>{c.granted=false;c.revokedAt=new Date();});
    expect((await request(app).get(`/api/v1/patients/${p.id}`).auth(token,{type:'bearer'})).status).toBe(403);
    expect(store.auditLogs.some(a=>a.action==='ACCESS_DENIED')).toBe(true);
  });
  it('prevents payment IDOR',async()=>{
    const l=await login('patient@medicore.health');const other=store.invoices.find(i=>i.patientId!==l.body.data.user.patientProfileId)!;
    expect((await request(app).post('/api/v1/billing/payments').auth(l.body.data.tokens.accessToken,{type:'bearer'}).send({invoiceId:other.id,amount:1,paymentMethod:'SIMULATED'})).status).toBe(403);
  });
  it('does not issue CORS permission to an untrusted website',async()=>{
    const r=await request(app).get('/health').set('Origin','https://localhost.evil.invalid');expect(r.headers['access-control-allow-origin']).toBeUndefined();
  });
  it('rejects expired access credentials',async()=>{
    const t=jwt.sign({userId:store.users[0].id},config.jwt.accessSecret,{expiresIn:-1});
    expect((await request(app).get('/api/v1/auth/me').auth(t,{type:'bearer'})).status).toBe(401);
  });
  it('hides preliminary laboratory results from patients',async()=>{
    const l=await login('patient@medicore.health');const patientId=l.body.data.user.patientProfileId;
    const order=store.labOrders.find(o=>o.patientId===patientId)!;expect(order).toBeDefined();
    const result={...store.labResults[0],id:'synthetic-unreleased-result',labOrderId:order.id,patientId,status:'PRELIMINARY',validatedAt:null};
    store.labResults.push(result);
    const r=await request(app).get('/api/v1/lab/orders').auth(l.body.data.tokens.accessToken,{type:'bearer'});
    expect(r.status).toBe(200);expect(r.body.data.flatMap((o:any)=>o.results).some((x:any)=>x.id===result.id)).toBe(false);
  });
});
