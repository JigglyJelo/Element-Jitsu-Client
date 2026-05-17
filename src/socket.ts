import { io, Socket } from 'socket.io-client';

export let socket: Socket;

export function initSocket(): void {
  const SERVER_URL = import.meta.env.DEV 
    ? 'http://localhost:3000' 
    : 'https://element-jitsu-server.onrender.com/';

  socket = io(SERVER_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    withCredentials: false
  });
}