/**
 * useTypingIndicator — debounced typing event emitter
 * Emits typing:true on keypress, typing:false after 1.5s idle
 */
import { useRef, useCallback } from 'react';

export function useTypingIndicator(socket, status) {
  const isTypingRef = useRef(false);
  const timeoutRef = useRef(null);

  const onKeyPress = useCallback(() => {
    if (status !== 'connected' || !socket) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('chat:typing', { isTyping: true });
    }

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('chat:typing', { isTyping: false });
    }, 1500);
  }, [socket, status]);

  const stopTyping = useCallback(() => {
    clearTimeout(timeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket?.emit('chat:typing', { isTyping: false });
    }
  }, [socket]);

  return { onKeyPress, stopTyping };
}
