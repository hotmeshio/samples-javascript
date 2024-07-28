import { Server as SocketIOServer } from 'socket.io';
import { Request } from 'express';

export interface CustomRequest extends Request {
  io: SocketIOServer;
}
