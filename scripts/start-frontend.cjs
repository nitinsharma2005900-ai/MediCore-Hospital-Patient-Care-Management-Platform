const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');const app=path.join(root,'apps/frontend');
const standalone=path.join(app,'.next/standalone/apps/frontend');
const entry=path.join(standalone,'server.js');
if(!fs.existsSync(entry)){console.error('Build the frontend before starting it: npm run build --workspace=apps/frontend');process.exit(1);}
fs.cpSync(path.join(app,'.next/static'),path.join(standalone,'.next/static'),{recursive:true});
if(fs.existsSync(path.join(app,'public')))fs.cpSync(path.join(app,'public'),path.join(standalone,'public'),{recursive:true});
const portArgument=process.argv.indexOf('--port');
if(portArgument>=0)process.env.PORT=process.argv[portArgument+1];
process.env.HOSTNAME=process.env.BIND_HOST||(process.env.RENDER?'0.0.0.0':'127.0.0.1');
require(entry);
