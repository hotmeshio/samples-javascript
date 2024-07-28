import 'dotenv/config';
import config from '../config';
import { MeshData } from '@hotmeshio/hotmesh';
import path from 'path';
import express, { NextFunction, Request, Response } from 'express';
//import morgan from 'morgan';
import winston from 'winston';
import expressWinston from 'express-winston';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

import { setupTelemetry } from '../services/tracer';
import { init as initMeshData } from '../services/namespaces/manifest';
import { router as billRouter } from './routes/bill';
import { router as userRouter } from './routes/user';
import { router as orderBillingRouter } from './routes/order_billing';
import { router as orderRoutingRouter } from './routes/order_routing';
import { router as orderSandboxRouter } from './routes/order_dashboard';
import { router as inventoryRouter } from './routes/inventory';
import { router as meshDataRouter } from './routes/meshdata';
import { router as testRouter } from './routes/test';
import { CustomRequest } from '../types/http';
import { Socket } from './utils/socket';

const app = express();

// Create a Winston logger instance with custom settings
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.json(),
    winston.format.timestamp(),
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new winston.transports.Console(),
    // Add other transports here, e.g., file transport for error logs
  ],
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.use(expressWinston.logger({
  winstonInstance: logger,
  msg: 'HTTP {{req.method}} {{req.url}} | Status: {{res.statusCode}} | Duration: {{res.responseTime}}ms | IP: {{req.ip}}',
  expressFormat: false,
  colorize: process.env.NODE_ENV === 'development',
  statusLevels: {
    success: 'info',
    warn: 'warn',
    error: 'error'
  },
  ignoreRoute: (req, res) => {
    if (req.url === '/health' || req.url === '/api/v1/meshdata/rollCall') {
      return true;
    }
    return false;
  },
  meta: true,
  dynamicMeta: (req, res) => {
    return {
      requestHeaders: req.headers,
      responseHeaders: res.getHeaders()
    };
  },
  responseWhitelist: ['statusCode', 'responseTime'],
  requestWhitelist: ['method', 'url', 'headers', 'query', 'body']
}));


// Error handling middleware
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
  checkNomadCpuCores();
  setupTelemetry();
  await initMeshData();

  // Express application setup
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.CORS_ORIGIN, // Ensure this matches your front-end URL, adjust as needed
      methods: ["GET", "POST"], // Allowed request methods
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

  // API route declarations
  app.use('/api/v1/bills', billRouter);
  app.use('/api/v1/billing/orders', orderBillingRouter);
  app.use('/api/v1/routing/orders', orderRoutingRouter);
  app.use('/api/v1/sandbox/orders', orderSandboxRouter);
  app.use('/api/v1/inventory', inventoryRouter);
  app.use('/api/v1/tests', testRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/meshdata', meshDataRouter);

  // Static React Webapp serving
  app.use(express.static(path.join(__dirname, '../app/build')));
  app.get('/*', (req, res) => {
      res.sendFile(path.join(__dirname, '../app/build', 'index.html'));
  });

  // Socket.io setup
  io.on('connection', (socket) => {
    console.log('io socket connected');

    // socket.on('updateUser', (data) => {
    //   io.emit('mesh.planes.control', data);
    // });

    socket.on('disconnect', () => {
      console.log('io socket disconnected');
    });
  });

  // Start HTTP server
  const PORT = process.env.PORT || 3010;
  httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Call initialize function
initialize().catch(error => {
  console.error('Failed to initialize the application:', error);
  process.exit(1);
});

// Disconnect MeshData and Express; exit the process
async function shutdown() {
  await MeshData.shutdown();
  //todo: close express server
  process.exit(0);
}

// Quit on ctrl-c when running docker in terminal
process.on('SIGINT', async function onSigint() {
  console.log('Got SIGINT (aka ctrl-c in docker). Graceful shutdown', { loggedAt: new Date().toISOString() });
  await shutdown();
});

// Quit properly on docker stop
process.on('SIGTERM', async function onSigterm() {
  console.log('Got SIGTERM (docker container stop). Graceful shutdown', { loggedAt: new Date().toISOString() });
  await shutdown();
});

// Function to check and log the NOMAD_CPU_CORES environment variable, temporary helper
function checkNomadCpuCores() {
  const nomadCpuCores = process.env.NOMAD_CPU_CORES;

  if (nomadCpuCores) {
      logger.info(`NOMAD_CPU_CORES is set to ${nomadCpuCores} CPU cores.`);
  } else {
      logger.info('NOMAD_CPU_CORES is not set.');
  }
}
