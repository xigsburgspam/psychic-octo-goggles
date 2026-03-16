import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { connectSocket } from '../lib/socket';
import WebRTCManager from '../lib/webrtc';
import { useAppStore, useChatStore } from '../lib/store';
import ChatPanel from '../components/chat/ChatPanel';
import VideoPanel from '../components/video/VideoPanel';
import SearchingOverlay from '../components/chat/SearchingOverlay';
import ChatControls from '../components/chat/ChatControls';
import ReportModal from '../components/ui/ReportModal';

export default function ChatPage() {
  const router = useRouter();
  const { mode } = router.query;

  const { nickname, interests, chatMode, setChatMode } = useAppStore();
  const {
    status, partnerNickname, sharedInterests, isInitiator,
    messages, isPartnerTyping, connectionState,
    setStatus, setPartner, addMessage, clearMessages,
    setPartnerTyping, setConnectionState, reset,
  } = useChatStore();

  const socketRef = useRef(null);
  const webrtcRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [icebreakers, setIcebreakers] = useState([]);

  const currentMode = mode || chatMode;

  // ── Initialize socket and listeners ─────────────────────────────────────
  useEffect(() => {
    if (!nickname) {
      router.replace('/');
      return;
    }

    const socket = connectSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      // Register user
      socket.emit('user:register', {
        nickname,
        interests,
        mode: currentMode,
        language: navigator.language?.slice(0, 2) || 'en',
      });
    });

    socket.on('user:registered', () => {
      // Start searching immediately
      socket.emit('chat:find', { mode: currentMode, interests });
      setStatus('searching');
    });

    socket.on('chat:searching', () => {
      setStatus('searching');
    });

    socket.on('chat:connected', async (data) => {
      clearMessages();
      setPartner({
        partnerNickname: data.partnerNickname,
        sharedInterests: data.sharedInterests || [],
        isInitiator: data.isInitiator,
        pairId: data.pairId,
      });
      setStatus('connected');

      // Add system message
      addMessage({
        id: Date.now().toString(),
        type: 'system',
        text: `You're now chatting with ${data.partnerNickname}${
          data.sharedInterests?.length ? ` (shared: ${data.sharedInterests.join(', ')})` : ''
        }`,
        timestamp: Date.now(),
      });

      // Fetch icebreakers
      fetchIcebreakers(interests);

      // If video mode, start WebRTC
      if (currentMode === 'video') {
        await initWebRTC(data.isInitiator);
      }
    });

    socket.on('chat:message', (message) => {
      addMessage(message);
    });

    socket.on('chat:message:sent', (message) => {
      addMessage({ ...message, isSelf: true });
    });

    socket.on('chat:typing', ({ isTyping }) => {
      setPartnerTyping(isTyping);
    });

    socket.on('chat:partner_disconnected', () => {
      setStatus('disconnected');
      setPartnerTyping(false);
      addMessage({
        id: Date.now().toString(),
        type: 'system',
        text: 'Your partner has disconnected.',
        timestamp: Date.now(),
      });

      // Clean up WebRTC
      if (webrtcRef.current) {
        webrtcRef.current.destroy();
        webrtcRef.current = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });

    socket.on('chat:stopped', () => {
      setStatus('idle');
      reset();
    });

    socket.on('chat:warning', ({ message }) => {
      toast.error(message);
    });

    socket.on('user:banned', ({ message }) => {
      toast.error(message);
      setTimeout(() => router.push('/'), 2000);
    });

    socket.on('stats:update', ({ onlineCount }) => {
      useAppStore.getState().setOnlineCount(onlineCount);
    });

    socket.on('disconnect', () => {
      if (status === 'connected') {
        setStatus('disconnected');
      }
    });

    return () => {
      socket.off('connect');
      socket.off('user:registered');
      socket.off('chat:searching');
      socket.off('chat:connected');
      socket.off('chat:message');
      socket.off('chat:message:sent');
      socket.off('chat:typing');
      socket.off('chat:partner_disconnected');
      socket.off('chat:stopped');
      socket.off('chat:warning');
      socket.off('user:banned');
      socket.off('stats:update');
      socket.off('disconnect');

      // Clean up
      if (webrtcRef.current) {
        webrtcRef.current.destroy();
        webrtcRef.current = null;
      }
      socket.emit('chat:stop');
      socket.disconnect();
    };
  }, [nickname]);

  // ── WebRTC initialization ─────────────────────────────────────────────
  const initWebRTC = async (isInit) => {
    const socket = socketRef.current;
    if (!socket) return;

    const webrtc = new WebRTCManager({
      socket,
      onRemoteStream: (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      },
      onConnectionState: (state) => {
        setConnectionState(state);
        if (state === 'failed') {
          toast.error('Video connection failed. Check your network.');
        }
      },
      onError: (msg) => toast.error(msg),
    });

    webrtcRef.current = webrtc;

    // Get local media
    const localStream = await webrtc.getLocalMedia({ video: true, audio: true });
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }

    // Start WebRTC handshake
    if (isInit) {
      // Small delay to ensure both sides are ready
      setTimeout(() => webrtc.createOffer(), 500);
    }
  };

  // ── Actions ───────────────────────────────────────────────────────────
  const handleSkip = () => {
    if (webrtcRef.current) {
      webrtcRef.current.destroy();
      webrtcRef.current = null;
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;

    socketRef.current?.emit('chat:skip');
    setStatus('searching');
    clearMessages();
    setIcebreakers([]);

    if (currentMode === 'video') {
      // Re-init local stream for next session
      const webrtc = new WebRTCManager({
        socket: socketRef.current,
        onRemoteStream: (stream) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
        },
        onConnectionState: setConnectionState,
        onError: (msg) => toast.error(msg),
      });
      webrtcRef.current = webrtc;
      webrtc.getLocalMedia({ video: true, audio: true }).then(stream => {
        if (stream && localVideoRef.current) localVideoRef.current.srcObject = stream;
      });
    }
  };

  const handleStop = () => {
    socketRef.current?.emit('chat:stop');
    if (webrtcRef.current) {
      webrtcRef.current.destroy();
      webrtcRef.current = null;
    }
    reset();
    router.push('/');
  };

  const handleToggleAudio = () => {
    if (webrtcRef.current) {
      const enabled = webrtcRef.current.toggleAudio();
      setIsMuted(!enabled);
    }
  };

  const handleToggleCamera = () => {
    if (webrtcRef.current) {
      const enabled = webrtcRef.current.toggleVideo();
      setIsCameraOff(!enabled);
    }
  };

  const fetchIcebreakers = async (userInterests) => {
    try {
      const params = userInterests.length ? `?interests=${userInterests.join(',')}` : '';
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/chat/icebreakers${params}`
      );
      const data = await res.json();
      setIcebreakers(data.suggestions || []);
    } catch (e) {
      // Silently fail
    }
  };

  const handleNewChat = () => {
    socketRef.current?.emit('chat:find', { mode: currentMode, interests });
    setStatus('searching');
    clearMessages();
    setIcebreakers([]);
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Chat — Addagle</title>
      </Head>

      <div className="fixed inset-0 flex flex-col" style={{ background: 'var(--bg)', zIndex: 1 }}>

        {/* ── Top bar ─────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-4 py-3 glass border-b shrink-0"
          style={{ borderColor: 'var(--border)', zIndex: 10 }}>
          <button onClick={() => router.push('/')} className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, var(--brand), #8b5cf6)' }}>A</div>
            <span className="font-bold text-sm hidden sm:block" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
              Addagle
            </span>
          </button>

          <div className="flex items-center gap-3">
            {status === 'connected' && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs"
                style={{ background: 'rgba(34, 211, 165, 0.1)', border: '1px solid rgba(34, 211, 165, 0.2)', color: '#22d3a5' }}>
                <span className="online-dot" style={{ width: '6px', height: '6px' }} />
                {partnerNickname || 'Stranger'}
                {sharedInterests?.length > 0 && (
                  <span style={{ color: 'var(--text-muted)' }}>· {sharedInterests.slice(0, 2).join(', ')}</span>
                )}
              </div>
            )}

            <button
              onClick={() => setShowReport(true)}
              disabled={status !== 'connected'}
              className="p-2 rounded-lg text-sm transition-colors disabled:opacity-30"
              style={{ color: 'var(--text-muted)', background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
              title="Report user"
            >
              🚩
            </button>
          </div>
        </header>

        {/* ── Main area ───────────────────────────────────────────────── */}
        <div className="flex-1 flex overflow-hidden relative">

          {/* Searching overlay */}
          <AnimatePresence>
            {status === 'searching' && (
              <SearchingOverlay onCancel={handleStop} />
            )}
          </AnimatePresence>

          {/* Idle / disconnected state */}
          <AnimatePresence>
            {(status === 'idle' || status === 'disconnected') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center z-10"
                style={{ background: 'var(--bg)' }}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">{status === 'disconnected' ? '👋' : '💬'}</div>
                  <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                    {status === 'disconnected' ? 'Chat Ended' : 'Ready to chat?'}
                  </h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                    {status === 'disconnected' ? 'Your partner disconnected.' : 'Click below to find a stranger.'}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNewChat}
                      className="px-6 py-3 rounded-xl font-semibold text-sm"
                      style={{
                        background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
                        color: 'white',
                        fontFamily: 'var(--font-display)',
                        boxShadow: '0 8px 32px var(--brand-glow)',
                      }}
                    >
                      {status === 'disconnected' ? '🔄 New Chat' : '▶ Start Chat'}
                    </motion.button>
                    {status === 'disconnected' && (
                      <button onClick={handleStop}
                        className="px-6 py-3 rounded-xl font-semibold text-sm"
                        style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                        🏠 Home
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Video layout ─────────────────────────────────────────── */}
          {currentMode === 'video' && (
            <VideoPanel
              localVideoRef={localVideoRef}
              remoteVideoRef={remoteVideoRef}
              isFullscreen={isFullscreen}
              setIsFullscreen={setIsFullscreen}
              connectionState={connectionState}
              status={status}
              isCameraOff={isCameraOff}
              isMuted={isMuted}
              onToggleAudio={handleToggleAudio}
              onToggleCamera={handleToggleCamera}
            />
          )}

          {/* ── Chat panel ──────────────────────────────────────────── */}
          <ChatPanel
            socket={socketRef.current}
            status={status}
            messages={messages}
            isPartnerTyping={isPartnerTyping}
            partnerNickname={partnerNickname}
            icebreakers={icebreakers}
            isVideoMode={currentMode === 'video'}
            isFullscreen={isFullscreen}
          />
        </div>

        {/* ── Bottom controls ─────────────────────────────────────────── */}
        <ChatControls
          status={status}
          mode={currentMode}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          onSkip={handleSkip}
          onStop={handleStop}
          onNewChat={handleNewChat}
          onToggleAudio={handleToggleAudio}
          onToggleCamera={handleToggleCamera}
        />
      </div>

      {/* Report modal */}
      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        socket={socketRef.current}
      />
    </>
  );
}
