const fs=require('fs');const {pool}=require('../apps/backend/dist/database/postgres');
(async()=>{
 const tables=(await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name`)).rows.map(r=>r.table_name);
 const columns=(await pool.query(`SELECT table_name,column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position`)).rows;
 const constraints=(await pool.query(`SELECT c.conname,c.contype,t.relname AS source,r.relname AS target,pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace LEFT JOIN pg_class r ON r.oid=c.confrelid WHERE n.nspname='public' ORDER BY t.relname,c.conname`)).rows;
 fs.writeFileSync('docs/evidence/schema-evidence.json',JSON.stringify({tables,columns,constraints},null,2));
 const relations=constraints.filter(c=>c.contype==='f').map(c=>`    ${c.target} ||--o{ ${c.source} : "${c.conname}"`).join('\n');
 fs.writeFileSync('docs/architecture/er-diagram.md','# Database ER diagram\n\nGenerated from the verified PostgreSQL foreign-key catalog. SQL migrations are authoritative; `database/prisma/schema.prisma` is the original unused reference template. Composite keys enforce patient/order/encounter consistency.\n\n```mermaid\nerDiagram\n'+relations+'\n```\n\n'+constraints.filter(c=>['x','c','u'].includes(c.contype)).map(c=>`- **${c.source}.${c.conname}:** ${c.definition}`).join('\n')+'\n');
 console.log('Captured '+tables.length+' tables and '+constraints.filter(c=>c.contype==='f').length+' foreign-key constraints');await pool.end();
})().catch(async e=>{console.error(e.message);await pool.end();process.exit(1);});
