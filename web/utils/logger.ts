import winston, { Logger } from 'winston';
import expressWinston from 'express-winston';
import { Application } from 'express';

export const configureLogger = (app: Application): Logger => {
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

  return logger;
};
