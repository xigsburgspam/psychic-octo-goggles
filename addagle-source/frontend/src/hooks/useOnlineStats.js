/**
 * useOnlineStats — polls and listens for live online user count
 */
import { useState, useEffect } from 'react';
import { getSocket } from '../lib/socket';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useOnlineStats() {
  const [stats, setStats] = useState({ online: 0, waiting: 0 });

  useEffect(() => {
    // Initial fetch
    fetch(`${API_URL}/api/chat/stats`)
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {});

    // Poll every 15s
    const interval = setInterval(() => {
      fetch(`${API_URL}/api/chat/stats`)
        .then(r => r.json())
        .then(data => setStats(data))
        .catch(() => {});
    }, 15000);

    // Also listen via socket if connected
    const socket = getSocket();
    const handler = ({ onlineCount }) => {
      setStats(prev => ({ ...prev, online: onlineCount }));
    };
    socket.on('stats:update', handler);

    return () => {
      clearInterval(interval);
      socket.off('stats:update', handler);
    };
  }, []);

  return stats;
}
