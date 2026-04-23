import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation and transformation for all incoming requests
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  // Parse cookies from incoming requests
  app.use(cookieParser());

  // Security headers with Helmet
  // CSP is disabled for the API backend — it only returns JSON, not HTML.
  // CSP protection belongs on the frontend. Keeping other security headers.
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // Enable XSS filter
    xssFilter: true,
    // Enable HSTS in production
    hsts: process.env.NODE_ENV === 'production' ? {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    } : false,
  }));

  // Raw body parsing for Stripe webhooks - must be before body-parser.json()
  app.use('/api/webhooks/stripe', bodyParser.raw({ type: 'application/json' }));

  // Enable CORS for frontend requests with credentials
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
  });

  // Configure Socket.io adapter
  app.useWebSocketAdapter(
    new IoAdapter(app)
  );

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 5000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
  console.log(`Socket.io available at: http://localhost:${port}/socket.io`);
}
bootstrap();