import { motion } from 'framer-motion';

export default function ChatControls({
  status, mode, isMuted, isCameraOff,
  onSkip, onStop, onNewChat,
  onToggleAudio, onToggleCamera,
}) {
  const isConnected = status === 'connected';
  const isSearching = status === 'searching';

  return (
    <div className="shrink-0 flex items-center justify-center gap-3 px-4 py-3 glass border-t"
      style={{ borderColor: 'var(--border)', zIndex: 10 }}>

      {/* Stop / Home */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStop}
        className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
        style={{
          background: 'rgba(248, 113, 113, 0.1)',
          border: '1px solid rgba(248, 113, 113, 0.3)',
          color: '#f87171',
          fontFamily: 'var(--font-display)',
        }}
      >
        ✕ Stop
      </motion.button>

      {/* Skip / New chat */}
      {(isConnected || isSearching) && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isConnected ? onSkip : undefined}
          disabled={isSearching}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
            color: 'white',
            fontFamily: 'var(--font-display)',
            boxShadow: '0 4px 16px var(--brand-glow)',
          }}
        >
          {isConnected ? '⏭ Next' : '⌛ Searching...'}
        </motion.button>
      )}

      {/* New chat when idle/disconnected */}
      {(status === 'idle' || status === 'disconnected') && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNewChat}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold"
          style={{
            background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
            color: 'white',
            fontFamily: 'var(--font-display)',
            boxShadow: '0 4px 16px var(--brand-glow)',
          }}
        >
          ▶ New Chat
        </motion.button>
      )}

      {/* Video controls (only in video mode) */}
      {mode === 'video' && (
        <>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleAudio}
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all"
            style={{
              background: isMuted ? 'rgba(248,113,113,0.2)' : 'var(--surface-overlay)',
              border: `1px solid ${isMuted ? 'rgba(248,113,113,0.4)' : 'var(--border)'}`,
              color: isMuted ? '#f87171' : 'var(--text)',
            }}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🎤'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleCamera}
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all"
            style={{
              background: isCameraOff ? 'rgba(248,113,113,0.2)' : 'var(--surface-overlay)',
              border: `1px solid ${isCameraOff ? 'rgba(248,113,113,0.4)' : 'var(--border)'}`,
              color: isCameraOff ? '#f87171' : 'var(--text)',
            }}
            title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isCameraOff ? '📵' : '📹'}
          </motion.button>
        </>
      )}
    </div>
  );
}
