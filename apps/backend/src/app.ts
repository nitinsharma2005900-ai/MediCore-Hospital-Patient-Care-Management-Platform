import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import routes from './routes';
import { requestIdMiddleware } from './middlewares/request-id.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { getHealth, getReadiness } from './controllers/health.controller';
import openapiSpec from './swagger/openapi.json';
import { databaseRequest } from './database/postgres';
import { validateQuery } from './middlewares/query.middleware';

export const createApp = () => {
  const app = express();

  // 1. Security Headers
  app.use(helmet({
    contentSecurityPolicy: false // Allow Swagger UI inline assets
  }));

  // 2. CORS
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (config.cors.origin.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id']
  }));

  // 3. Request parsing & correlation ID
  app.use(express.json({ limit: '2mb' }));
  app.use(requestIdMiddleware);

  if (process.env.NODE_ENV !== 'test') {
    app.use((req,res,next)=>{
      const started=Date.now();
      res.once('finish',()=>console.log(JSON.stringify({event:'http_request',method:req.method,
        route:req.route?.path || req.path.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi,':id'),status:res.statusCode,
        requestId:req.correlationId,durationMs:Date.now()-started})));
      next();
    });
  }

  // 4. Health & Diagnostics
  app.get('/health', getHealth);
  app.get('/ready', getReadiness);

  // 5. Swagger UI Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
    customSiteTitle: 'MediCore API Documentation',
    customCss: '.swagger-ui .topbar { background-color: #0F766E; }'
  }));

  // 6. Primary Business REST API
  app.use('/api/v1', validateQuery, databaseRequest, routes);

  // 7. 404 Route Not Found
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`
      },
      meta: {
        requestId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    });
  });

  // 8. Centralized Safe Error Handler
  app.use(errorHandler);

  return app;
};
