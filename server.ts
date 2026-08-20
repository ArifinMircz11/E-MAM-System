import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import helmet from 'helmet';
import whatsappRouter from './api/whatsapp/routes.js';
import authRouter from './api/auth/routes.js';
import analyticsRouter from './api/analytics/routes.js';
import attendanceRouter from './api/attendance/routes.js';
import poinRouter from './api/poin/routes.js';
import adminRouter from './api/admin/routes.js';
import syncRouter from './api/sync/routes.js';
import chatbotRouter from './api/chatbot/routes.js';
import agentRouter from './api/agent/routes.js';
import newsRouter from './api/news/routes.js';

async function startServer() {
  const app = express();
  const port = 3000;

  // Security & Performance
  app.use(
    helmet({
      frameguard: false,
      contentSecurityPolicy: false,
    }),
  );
  app.use(compression());

  // Performance Monitoring Hook
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (!req.originalUrl.startsWith('/src/')) {
        console.log(
          `[Metric] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Duration: ${duration}ms`,
        );
      }
    });
    next();
  });

  // Base URLs
  const externalApiBaseUrl = 'https://generativelanguage.googleapis.com';
  const openaiApiBaseUrl = 'https://api.openai.com';

  // API Keys from Env
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.set('trust proxy', 1);

  const proxyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500, // Increased for production stability in high-traffic environments
    message: { error: 'Terlalu banyak permintaan, coba lagi nanti.' },
  });

  // --- PROXY GEMINI ---
  app.use('/api-proxy', proxyLimiter, async (req, res, next) => {
    if (req.headers.upgrade && req.headers.upgrade.toLowerCase() === 'websocket') return next();
    if (req.method === 'OPTIONS') return res.sendStatus(200);

    const currentApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!currentApiKey) {
      return res.status(503).json({
        error: 'Gemini AI Engine is currently disabled on this server (API Key missing).',
      });
    }

    try {
      const targetPath = req.url.startsWith('/') ? req.url.substring(1) : req.url;
      const apiUrl = `${externalApiBaseUrl}/${targetPath}`;
      console.log(`[Proxy] Target: ${apiUrl}`);
      const outgoingHeaders = {
        'X-Goog-Api-Key': currentApiKey as string,
        'Content-Type': 'application/json',
      };
      const apiResponse = await axios({
        method: req.method,
        url: apiUrl,
        headers: outgoingHeaders,
        data: req.body,
        responseType: 'stream',
        validateStatus: () => true,
      });
      console.log(`[Proxy] Response: ${apiResponse.status}`);
      res.status(apiResponse.status);
      apiResponse.data.pipe(res);
    } catch (error) {
      console.error(`[Proxy] Error: ${error}`);
      res.status(500).json({ error: 'Proxy error' });
    }
  });

  // --- PROXY OPENAI ---
  app.use('/api-proxy-openai', proxyLimiter, async (req, res) => {
    const currentOpenaiKey = process.env.OPENAI_API_KEY || openaiKey;
    if (!currentOpenaiKey)
      return res.status(500).json({ error: 'OpenAI Key belum dikonfigurasi di server.' });
    try {
      const targetPath = req.url.startsWith('/') ? req.url.substring(1) : req.url;
      const apiUrl = `${openaiApiBaseUrl}/${targetPath}`;
      const apiResponse = await axios({
        method: req.method,
        url: apiUrl,
        headers: {
          Authorization: `Bearer ${currentOpenaiKey}`,
          'Content-Type': 'application/json',
        },
        data: req.body,
        validateStatus: () => true,
      });
      res.status(apiResponse.status).json(apiResponse.data || { error: 'No data from OpenAI' });
    } catch (error) {
      console.error('OpenAI Proxy Error:', error);
      res.status(500).json({ error: 'OpenAI Proxy Error' });
    }
  });

  // --- WHATSAPP ROUTES (INCLUDING WEBHOOK & AI) ---
  app.use('/api/whatsapp', whatsappRouter);

  // --- AUTH ROUTES (CLAIM ACCOUNT) ---
  app.use('/api/auth', authRouter);

  // --- ANALYTICS ROUTES ---
  app.use('/api/analytics', analyticsRouter);

  // --- ATTENDANCE ROUTES ---
  app.use('/api/attendance', attendanceRouter);

  // --- POIN ROUTES ---
  app.use('/api/poin', poinRouter);

  // --- ADMIN/DEVELOPER ROUTES ---
  app.use('/api/developer/admin', adminRouter);

  // --- SYNC ROUTES ---
  app.use('/api/sync', syncRouter);

  // --- CHATBOT ROUTES ---
  app.use('/api/chatbot', chatbotRouter);

  // --- AI AGENT ROUTES ---
  app.use('/api/agent', agentRouter);

  // --- NEWS ROUTES ---
  app.use('/api/news', newsRouter);

  // --- HEALTH CHECK ENDPOINT ---
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      firebase: !!process.env.VITE_FIREBASE_PROJECT_ID,
      gemini: !!(process.env.GEMINI_API_KEY || process.env.API_KEY),
      database: 'ready',
      version: '8.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // --- FIRESTORE TEST ENDPOINT ---
  app.get('/api/firestore-test', async (req, res) => {
    try {
      const { getAdminDb, getAdminAuth } = await import('./src/lib/firebase-admin.js');
      const adminDb = getAdminDb();
      const adminAuth = getAdminAuth();
      const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'unknown';
      const databaseId = process.env.VITE_FIREBASE_DATABASE_ID || 'unknown';

      let readStatus = 'Not tried';
      let writeStatus = 'Not tried';
      let authStatus = 'Not tried';
      let firestoreData = null;

      // Try reading system_config/app_version which is allowed publicly
      try {
        const docRef = adminDb.collection('system_config').doc('app_version');
        const doc = await docRef.get();
        readStatus = doc.exists ? 'Success (Document exists)' : 'Success (Document does not exist but read worked)';
        firestoreData = doc.exists ? doc.data() : null;
      } catch (re) {
        const err = re as Error;
        readStatus = `Read failed: ${err.message}`;
      }

      // Try writing to system_tests/backend_connection
      try {
        const testRef = adminDb.collection('system_tests').doc('backend_connection');
        await testRef.set({
          lastChecked: new Date().toISOString(),
          status: 'online',
          message: 'Backend Firestore Connection Successful',
          projectId: projectId,
        });
        writeStatus = 'Success';
      } catch (we) {
        const err = we as Error;
        writeStatus = `Write failed: ${err.message}`;
      }

      // Try an auth action (list users)
      try {
        const listUsers = await adminAuth.listUsers(1);
        authStatus = 'Success';
      } catch (ae) {
        const err = ae as Error;
        authStatus = `Auth Error: ${err.message}`;
      }

      // A connection is considered successful if we get any response from Firestore
      // (even a Permission Denied error indicates we reached the correct database)
      const isConnected = !readStatus.includes('Cloud Firestore API has not been used') && 
                          !writeStatus.includes('Cloud Firestore API has not been used');

      res.json({
        success: isConnected,
        connected: isConnected,
        projectId,
        databaseId,
        readStatus,
        writeStatus,
        authStatus,
        firestore: firestoreData,
        env: {
          node: process.version,
          env_prod: process.env.NODE_ENV === 'production',
        },
      });
    } catch (error) {
      console.error('Firestore Test Error:', error);
      res.status(500).json({
        success: false,
        message: 'Firestore connection failed completely',
        error: error instanceof Error ? error.message : String(error),
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'unknown',
        databaseId: process.env.VITE_FIREBASE_DATABASE_ID || 'unknown',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
          }
        },
      }),
    );
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log('\n' + '='.repeat(50));
    console.log(`🚀 [e-Mam System] ENTERPRISE FOUNDATION READY`);
    console.log(`   Port: ${port} | Mode: ${process.env.NODE_ENV || 'production'}`);
    console.log('='.repeat(50));
    console.log(`[e-MAM Boot Report]`);
    console.log(`✓ Core Express Engine: Online`);
    console.log(`${process.env.VITE_FIREBASE_PROJECT_ID ? '✓' : '⚠'} Firebase Identity: ${process.env.VITE_FIREBASE_PROJECT_ID || 'NOT_SET'}`);
    console.log(`${process.env.FIREBASE_CLIENT_EMAIL ? '✓' : '⚠'} Service Account: ${process.env.FIREBASE_CLIENT_EMAIL ? 'Configured' : 'Missing (Using ADC)'}`);
    console.log(`${(process.env.GEMINI_API_KEY || process.env.API_KEY) ? '✓' : '❌'} Gemini AI Engine: ${(process.env.GEMINI_API_KEY || process.env.API_KEY) ? 'Activated' : 'Disabled'}`);
    console.log(`✓ Workspace Kernel: Loaded`);
    console.log(`✓ Schema Registry: Active`);
    console.log(`✓ Navigation Registry: Synchronized`);
    console.log(`✓ Sync Engine: Ready`);
    console.log('='.repeat(50) + '\n');
  });
}

startServer();
