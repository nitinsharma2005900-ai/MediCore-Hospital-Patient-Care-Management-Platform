import { createApp } from './app';
import { config } from './config';
import { seedDatabase } from './database/seed';
import { store } from './database/store';

async function bootstrap() {
  if (store.users.length === 0) {
    console.log('[MediCore Server] Populating initial synthetic hospital dataset...');
    await seedDatabase();
  }

  const app = createApp();

  function startListening(port: number) {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log('================================================================');
      console.log(` MediCore Hospital REST Backend API Service`);
      console.log(` Environment : ${config.env}`);
      console.log(` Port        : ${port}`);
      console.log(` API Base    : http://localhost:${port}/api/v1`);
      console.log(` Swagger Docs: http://localhost:${port}/api-docs`);
      console.log(` Health Check: http://localhost:${port}/health`);
      console.log('================================================================');
    });

    server.on('error', (err: any) => {
      if ((err.code === 'EADDRINUSE' || err.code === 'EACCES') && port === 4000) {
        console.warn(`[MediCore Server] Port 4000 is unavailable (${err.code}). Falling back to port 4001...`);
        startListening(4001);
      } else {
        console.error('[MediCore Server] Fatal server error:', err);
        process.exit(1);
      }
    });

    const shutdown = () => {
      console.log('[MediCore Server] Received termination signal. Closing gracefully...');
      server.close(() => {
        console.log('[MediCore Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }

  startListening(config.port);
}

bootstrap().catch((err) => {
  console.error('[MediCore Server] Bootstrap error:', err);
  process.exit(1);
});
