import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const SOCKET_URL = rawUrl.replace(/\/api\/?$/, "");

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'], // Allow polling fallback
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { socket: socketRef.current, isConnected };
}
