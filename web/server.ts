import 'dotenv/config';
import config from '../config';
import { MeshData } from '@hotmeshio/hotmesh';
import path from 'path';
import express, { NextFunction, Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

import { setupTelemetry, shutdownTelemetry } from '../modules/tracer';
import { router as billRouter } from './routes/bill';
import { router as userRouter } from './routes/user';
import { router as orderBillingRouter } from './routes/order_billing';
import { router as orderRoutingRouter } from './routes/order_routing';
import { router as inventoryRouter } from './routes/inventory';
import { router as meshDataRouter } from './routes/meshdata';
import { router as testRouter } from './routes/test';
import { CustomRequest } from '../types/http';
import { Socket } from './utils/socket';
import { startMyCron } from '../cron';
import { configureLogger } from './utils/logger';
import { initializeHotMesh } from './utils/meshdata';

const app = express();
const logger = configureLogger(app);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Generic Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

const corsOptions = {
  origin: config.CORS_ORIGIN, // adjust according to the front-end URL
  credentials: true, // important for sessions (or token authentication in cookies)
};
app.use(cors(corsOptions));

async function initialize() {
  setupTelemetry();
  await initializeHotMesh();

  // Start a custom cron job
  await startMyCron(
    'my-123-cron',
    'my.demo.cron',
    async (id: string, input: string) => {
      console.log('cron  worker called >', id);
      return `Welcome, ${input}.`;
    },
    ['my-123-cron', 'CoolMesh'],
  );

  // Express application setup
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true
    }
  });
  Socket.bindServer(io);

  // Express Middleware config
  app.use(express.json());
  app.use((req, _, next) => {
    (req as CustomRequest).io = io;
    next();
  });

  // API routes
  app.use('/api/v1/bills', billRouter);
  app.use('/api/v1/billing/orders', orderBillingRouter);
  app.use('/api/v1/routing/orders', orderRoutingRouter);
  app.use('/api/v1/inventory', inventoryRouter);
  app.use('/api/v1/tests', testRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/meshdata', meshDataRouter); //RPC style API

  // Static React Webapp
  app.use(express.static(path.join(__dirname, '../node_modules/@hotmeshio/dashboard/build')));
  app.get('/*', (req, res) => {
      res.sendFile(path.join(__dirname, '../node_modules/@hotmeshio/dashboard/build', 'index.html'));
  });

  // Socket.io setup
  io.on('connection', (socket) => {
    console.log('io socket connected');

    socket.on('disconnect', () => {
      console.log('io socket disconnected');
    });
  });

  // Start HTTP server
  const PORT = process.env.PORT || 3010;
  httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

initialize().catch(error => {
  console.error('Failed to initialize the application:', error);
  process.exit(1);
});

// Disconnect MeshData and Express; exit the process
async function shutdown() {
  await MeshData.shutdown();
  await shutdownTelemetry();
  process.exit(0);
}

// Quit on ctrl-c when running docker in terminal
process.on('SIGINT', async function onSigint() {
  console.log('Got SIGINT (aka ctrl-c in docker). Graceful shutdown', { loggedAt: new Date().toISOString() });
  await shutdown();
});

// Quit on docker stop
process.on('SIGTERM', async function onSigterm() {
  console.log('Got SIGTERM (docker container stop). Graceful shutdown', { loggedAt: new Date().toISOString() });
  await shutdown();
});
