/**
 * useChat — custom hook
 *
 * Encapsulates all Socket.IO + WebRTC logic so the chat page
 * stays clean and declarative. Handles:
 *   - Socket connection lifecycle
 *   - User registration & matching
 *   - WebRTC offer/answer/ICE flow
 *   - Message send/receive
 *   - Typing indicators
 *   - Skip / Stop / New chat actions
 *   - Violation warnings
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { connectSocket } from '../lib/socket';
import WebRTCManager from '../lib/webrtc';
import { useAppStore, useChatStore } from '../lib/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useChat({ mode, localVideoRef, remoteVideoRef }) {
  const router = useRouter();
  const { nickname, interests } = useAppStore();

  const {
    status, messages, isPartnerTyping, partnerNickname,
    sharedInterests, connectionState,
    setStatus, setPartner, addMessage, clearMessages,
    setPartnerTyping, setConnectionState, reset,
  } = useChatStore();

  const socketRef = useRef(null);
  const webrtcRef = useRef(null);
  const [icebreakers, setIcebreakers] = useState([]);

  // ── Socket bootstrap ────────────────────────────────────────────────────
  useEffect(() => {
    if (!nickname) { router.replace('/'); return; }

    const socket = connectSocket();
    socketRef.current = socket;

    const onConnect = () => {
      socket.emit('user:register', {
        nickname,
        interests,
        mode,
        language: navigator.language?.slice(0, 2) || 'en',
      });
    };

    const onRegistered = () => {
      socket.emit('chat:find', { mode, interests });
      setStatus('searching');
    };

    const onSearching = () => setStatus('searching');

    const onConnected = async (data) => {
      clearMessages();
      setPartner({
        partnerNickname: data.partnerNickname,
        sharedInterests: data.sharedInterests || [],
        isInitiator: data.isInitiator,
        pairId: data.pairId,
      });
      setStatus('connected');

      addMessage({
        id: `sys-${Date.now()}`,
        type: 'system',
        text: buildConnectedMessage(data),
        timestamp: Date.now(),
      });

      fetchIcebreakers(interests);

      if (mode === 'video') {
        await startWebRTC(socket, data.isInitiator);
      }
    };

    const onMessage = (msg) => addMessage(msg);
    const onMessageSent = (msg) => addMessage({ ...msg, isSelf: true });
    const onTyping = ({ isTyping }) => setPartnerTyping(isTyping);

    const onPartnerDisconnected = () => {
      setStatus('disconnected');
      setPartnerTyping(false);
      addMessage({
        id: `sys-${Date.now()}`,
        type: 'system',
        text: 'Your partner has disconnected.',
        timestamp: Date.now(),
      });
      cleanupWebRTC();
    };

    const onStopped = () => { setStatus('idle'); reset(); };

    const onWarning = ({ message }) => toast.error(message, { icon: '⚠️' });

    const onBanned = ({ message }) => {
      toast.error(message, { duration: 5000 });
      setTimeout(() => router.push('/'), 2500);
    };

    const onDisconnect = () => {
      if (useChatStore.getState().status === 'connected') {
        setStatus('disconnected');
      }
    };

    socket.on('connect', onConnect);
    socket.on('user:registered', onRegistered);
    socket.on('chat:searching', onSearching);
    socket.on('chat:connected', onConnected);
    socket.on('chat:message', onMessage);
    socket.on('chat:message:sent', onMessageSent);
    socket.on('chat:typing', onTyping);
    socket.on('chat:partner_disconnected', onPartnerDisconnected);
    socket.on('chat:stopped', onStopped);
    socket.on('chat:warning', onWarning);
    socket.on('user:banned', onBanned);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('user:registered', onRegistered);
      socket.off('chat:searching', onSearching);
      socket.off('chat:connected', onConnected);
      socket.off('chat:message', onMessage);
      socket.off('chat:message:sent', onMessageSent);
      socket.off('chat:typing', onTyping);
      socket.off('chat:partner_disconnected', onPartnerDisconnected);
      socket.off('chat:stopped', onStopped);
      socket.off('chat:warning', onWarning);
      socket.off('user:banned', onBanned);
      socket.off('disconnect', onDisconnect);

      cleanupWebRTC();
      socket.emit('chat:stop');
      socket.disconnect();
    };
  }, [nickname, mode]);

  // ── WebRTC helpers ──────────────────────────────────────────────────────
  const startWebRTC = async (socket, isInitiator) => {
    const webrtc = new WebRTCManager({
      socket,
      onRemoteStream: (stream) => {
        if (remoteVideoRef?.current) remoteVideoRef.current.srcObject = stream;
      },
      onConnectionState: (state) => {
        setConnectionState(state);
        if (state === 'failed') toast.error('Video connection failed. Try skipping to a new partner.');
      },
      onError: (msg) => toast.error(msg),
    });

    webrtcRef.current = webrtc;

    const localStream = await webrtc.getLocalMedia({ video: true, audio: true });
    if (localStream && localVideoRef?.current) {
      localVideoRef.current.srcObject = localStream;
    }

    if (isInitiator) {
      setTimeout(() => webrtc.createOffer(), 600);
    }
  };

  const cleanupWebRTC = useCallback(() => {
    if (webrtcRef.current) {
      webrtcRef.current.destroy();
      webrtcRef.current = null;
    }
    if (remoteVideoRef?.current) remoteVideoRef.current.srcObject = null;
  }, [remoteVideoRef]);

  // ── Public actions ──────────────────────────────────────────────────────
  const sendMessage = useCallback((text) => {
    const trimmed = text?.trim();
    if (!trimmed || !socketRef.current) return;
    if (useChatStore.getState().status !== 'connected') return;
    socketRef.current.emit('chat:message', { text: trimmed });
  }, []);

  const sendTyping = useCallback((isTyping) => {
    socketRef.current?.emit('chat:typing', { isTyping });
  }, []);

  const skip = useCallback(() => {
    cleanupWebRTC();
    socketRef.current?.emit('chat:skip');
    setStatus('searching');
    clearMessages();
    setIcebreakers([]);

    // Reinit local video for next session
    if (mode === 'video' && socketRef.current) {
      startWebRTC(socketRef.current, false); // will become initiator/responder once matched
    }
  }, [mode, cleanupWebRTC]);

  const stop = useCallback(() => {
    cleanupWebRTC();
    socketRef.current?.emit('chat:stop');
    reset();
    router.push('/');
  }, [cleanupWebRTC]);

  const newChat = useCallback(() => {
    socketRef.current?.emit('chat:find', { mode, interests });
    setStatus('searching');
    clearMessages();
    setIcebreakers([]);
  }, [mode, interests]);

  const toggleAudio = useCallback(() => {
    return webrtcRef.current?.toggleAudio() ?? false;
  }, []);

  const toggleVideo = useCallback(() => {
    return webrtcRef.current?.toggleVideo() ?? false;
  }, []);

  const report = useCallback((reason, description) => {
    socketRef.current?.emit('user:report', { reason, description });
  }, []);

  // ── Icebreakers ─────────────────────────────────────────────────────────
  const fetchIcebreakers = async (userInterests) => {
    try {
      const params = userInterests?.length
        ? `?interests=${encodeURIComponent(userInterests.join(','))}`
        : '';
      const res = await fetch(`${API_URL}/api/chat/icebreakers${params}`);
      if (res.ok) {
        const data = await res.json();
        setIcebreakers(data.suggestions || []);
      }
    } catch (_) { /* silent */ }
  };

  return {
    // State
    status,
    messages,
    isPartnerTyping,
    partnerNickname,
    sharedInterests,
    connectionState,
    icebreakers,
    socket: socketRef.current,
    // Actions
    sendMessage,
    sendTyping,
    skip,
    stop,
    newChat,
    toggleAudio,
    toggleVideo,
    report,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────
function buildConnectedMessage(data) {
  const base = `Connected with ${data.partnerNickname || 'a stranger'}`;
  if (data.sharedInterests?.length) {
    return `${base} · shared: ${data.sharedInterests.join(', ')}`;
  }
  return base;
}
